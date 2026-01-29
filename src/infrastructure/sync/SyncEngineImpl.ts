import type { Event } from "@/src/domain/models/Event";
import { SyncStatus } from "@/src/domain/models/Event";
import { WatermelonEventStore } from "@/src/infrastructure/db/WatermelonEventStore";
import { SupabaseEventAPI } from "@/src/infrastructure/api/SupabaseEventAPI";
import type {
  ISyncEngine,
  IRemoteEventAPI,
  SyncEngineConfig,
  SyncState,
  SyncStats,
  SyncResult,
  ConflictStrategy,
  ConflictResolver,
} from "./SyncEngine";
import { SyncState as SyncStateEnum, ConflictStrategy as ConflictStrategyEnum } from "./SyncEngine";

const DEFAULT_CONFIG: Required<Omit<SyncEngineConfig, "apiEndpoint" | "apiToken" | "conflictResolver">> = {
  batchSize: 50,
  syncInterval: 30000,
  maxRetryAttempts: 3,
  retryDelay: 5000,
  exponentialBackoff: true,
  conflictStrategy: ConflictStrategyEnum.LAST_WRITE_WINS,
  wifiOnly: false,
  debug: false,
};

type StateChangeCallback = (state: SyncState) => void;
type StatsChangeCallback = (stats: SyncStats) => void;
type SyncCompleteCallback = (result: SyncResult) => void;
type SyncErrorCallback = (error: Error) => void;

export class SyncEngineImpl implements ISyncEngine {
  private config: Required<Omit<SyncEngineConfig, "apiToken" | "conflictResolver">> & {
    apiToken?: string;
    conflictResolver?: ConflictResolver;
  };
  private eventStore: WatermelonEventStore;
  private remoteAPI: IRemoteEventAPI;

  private state: SyncState = SyncStateEnum.IDLE;
  private stats: SyncStats = {
    totalSynced: 0,
    totalFailed: 0,
    pendingCount: 0,
    failedCount: 0,
    consecutiveFailures: 0,
  };

  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private isPausedFlag = false;

  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  private statsChangeCallbacks: Set<StatsChangeCallback> = new Set();
  private syncCompleteCallbacks: Set<SyncCompleteCallback> = new Set();
  private syncErrorCallbacks: Set<SyncErrorCallback> = new Set();

  constructor(config: Partial<SyncEngineConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiEndpoint: config.apiEndpoint ?? "",
      ...config,
    };
    this.eventStore = new WatermelonEventStore();
    this.remoteAPI = new SupabaseEventAPI();
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log("Sync engine already running");
      return;
    }

    this.isRunning = true;
    this.isPausedFlag = false;
    this.log("Starting sync engine");

    // Health check before starting
    const isHealthy = await this.remoteAPI.healthCheck();
    this.log(`Remote API health check: ${isHealthy ? "PASSED" : "FAILED"}`);

    if (!isHealthy) {
      this.log("WARNING: Remote API is not reachable. Check Supabase configuration and table setup.");
    }

    await this.updateStats();

    if (this.config.syncInterval > 0) {
      this.syncIntervalId = setInterval(() => {
        if (!this.isPausedFlag) {
          this.syncNow().catch((err) => this.handleError(err));
        }
      }, this.config.syncInterval);
    }

    // Initial sync
    await this.syncNow();
  }

  async stop(): Promise<void> {
    this.log("Stopping sync engine");
    this.isRunning = false;

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    this.setState(SyncStateEnum.IDLE);
  }

  async syncNow(): Promise<SyncResult> {
    if (this.state === SyncStateEnum.SYNCING) {
      this.log("Sync already in progress, skipping");
      return this.createEmptyResult();
    }

    if (this.isPausedFlag) {
      this.log("Sync is paused, skipping");
      return this.createEmptyResult();
    }

    this.setState(SyncStateEnum.SYNCING);

    try {
      const pendingEvents = await this.eventStore.getPendingEvents(this.config.batchSize);

      if (pendingEvents.length === 0) {
        this.log("No pending events to sync");
        this.setState(SyncStateEnum.IDLE);
        return this.createEmptyResult();
      }

      this.log(`Syncing ${pendingEvents.length} events`);

      const result = await this.syncEvents(pendingEvents);

      if (result.success) {
        this.stats.consecutiveFailures = 0;
      } else {
        this.stats.consecutiveFailures++;
      }

      await this.updateStats();
      this.setState(result.failedEvents.length > 0 ? SyncStateEnum.ERROR : SyncStateEnum.IDLE);
      this.notifySyncComplete(result);

      return result;
    } catch (error) {
      this.handleError(error as Error);
      this.setState(SyncStateEnum.ERROR);
      return this.createEmptyResult();
    }
  }

  async syncEvents(events: Event[]): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      syncedEvents: [],
      failedEvents: [],
      conflicts: [],
      duration: 0,
    };

    try {
      const apiResult = await this.remoteAPI.pushEvents(events);

      // Mark successful events as synced
      if (apiResult.syncedIds.length > 0) {
        await this.eventStore.markEventsSynced(apiResult.syncedIds, Date.now());
        result.syncedEvents = events.filter((e) => apiResult.syncedIds.includes(e.id));
        this.stats.totalSynced += apiResult.syncedIds.length;
      }

      // Handle failures
      for (const errorInfo of apiResult.errors) {
        const event = events.find((e) => e.id === errorInfo.eventId);
        if (event) {
          const currentRetry = (event.retryCount ?? 0) + 1;
          const retryable = currentRetry < this.config.maxRetryAttempts;

          if (retryable) {
            await this.eventStore.markEventsFailed([
              { id: event.id, error: errorInfo.error, retryCount: currentRetry },
            ]);
          }

          result.failedEvents.push({
            event,
            error: errorInfo.error,
            retryable,
          });
        }
      }

      // Handle conflicts (last-write-wins by default)
      for (const conflict of apiResult.conflicts) {
        const localEvent = events.find((e) => e.id === conflict.eventId);
        if (localEvent) {
          result.conflicts.push({
            event: localEvent,
            conflictType: "version",
            resolution: "local",
          });
        }
      }

      result.success = result.failedEvents.length === 0;
      result.duration = Date.now() - startTime;

      if (result.failedEvents.length > 0) {
        this.stats.totalFailed += result.failedEvents.length;
      }

      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.failedEvents = events.map((e) => ({
        event: e,
        error: (error as Error).message,
        retryable: true,
      }));
      return result;
    }
  }

  pause(): void {
    this.log("Pausing sync engine");
    this.isPausedFlag = true;
    this.setState(SyncStateEnum.PAUSED);
  }

  async resume(): Promise<void> {
    this.log("Resuming sync engine");
    this.isPausedFlag = false;
    this.setState(SyncStateEnum.IDLE);

    // Trigger immediate sync on resume
    await this.syncNow();
  }

  // ============================================================================
  // STATE & STATS
  // ============================================================================

  getState(): SyncState {
    return this.state;
  }

  getStats(): SyncStats {
    return { ...this.stats };
  }

  isSyncing(): boolean {
    return this.state === SyncStateEnum.SYNCING;
  }

  isPaused(): boolean {
    return this.isPausedFlag;
  }

  // ============================================================================
  // CONFLICT MANAGEMENT
  // ============================================================================

  setConflictStrategy(strategy: ConflictStrategy): void {
    this.config.conflictStrategy = strategy;
  }

  setConflictResolver(resolver: ConflictResolver): void {
    this.config.conflictResolver = resolver;
  }

  async getPendingConflicts(): Promise<Event[]> {
    // For now, we don't store conflicts - last-write-wins resolves them automatically
    return [];
  }

  async resolveConflict(
    _eventId: string,
    _resolution: "local" | "remote" | "merged",
    _resolvedData?: unknown
  ): Promise<void> {
    // Placeholder for manual conflict resolution
    this.log("Manual conflict resolution not yet implemented");
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  async retryFailedEvents(): Promise<SyncResult> {
    const failedEvents = await this.eventStore.getFailedEvents(this.config.batchSize);

    if (failedEvents.length === 0) {
      return this.createEmptyResult();
    }

    // Reset status to pending for retry
    await this.eventStore.updateEventStatusBatch(
      failedEvents.map((e) => ({
        id: e.id,
        status: SyncStatus.PENDING,
      }))
    );

    return this.syncEvents(failedEvents);
  }

  async retryEvent(eventId: string): Promise<SyncResult> {
    const event = await this.eventStore.getEventById(eventId);

    if (!event) {
      return this.createEmptyResult();
    }

    await this.eventStore.updateEventStatus(eventId, SyncStatus.PENDING);
    return this.syncEvents([event]);
  }

  async clearRetryQueue(): Promise<void> {
    const failedEvents = await this.eventStore.getFailedEvents();
    if (failedEvents.length > 0) {
      await this.eventStore.deleteEvents(failedEvents.map((e) => e.id));
    }
  }

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onStatsChange(callback: StatsChangeCallback): () => void {
    this.statsChangeCallbacks.add(callback);
    return () => this.statsChangeCallbacks.delete(callback);
  }

  onSyncComplete(callback: SyncCompleteCallback): () => void {
    this.syncCompleteCallbacks.add(callback);
    return () => this.syncCompleteCallbacks.delete(callback);
  }

  onSyncError(callback: SyncErrorCallback): () => void {
    this.syncErrorCallbacks.add(callback);
    return () => this.syncErrorCallbacks.delete(callback);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private setState(newState: SyncState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeCallbacks.forEach((cb) => cb(newState));
    }
  }

  private async updateStats(): Promise<void> {
    const pendingEvents = await this.eventStore.getPendingEvents();
    const failedEvents = await this.eventStore.getFailedEvents();

    this.stats.pendingCount = pendingEvents.length;
    this.stats.failedCount = failedEvents.length;
    this.stats.lastSyncAt = Date.now();

    this.statsChangeCallbacks.forEach((cb) => cb(this.getStats()));
  }

  private handleError(error: Error): void {
    this.log(`Sync error: ${error.message}`);
    this.syncErrorCallbacks.forEach((cb) => cb(error));
  }

  private notifySyncComplete(result: SyncResult): void {
    this.stats.lastSyncDuration = result.duration;
    this.syncCompleteCallbacks.forEach((cb) => cb(result));
  }

  private createEmptyResult(): SyncResult {
    return {
      success: true,
      syncedEvents: [],
      failedEvents: [],
      conflicts: [],
      duration: 0,
    };
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[SyncEngine] ${message}`);
    }
  }
}

// Factory function
export async function createSyncEngine(
  config: Partial<SyncEngineConfig> = {}
): Promise<SyncEngineImpl> {
  const engine = new SyncEngineImpl(config);
  return engine;
}
