/**
 * Sync Engine Interface
 *
 * Handles synchronization of local events to remote server.
 * Manages retry logic, conflict resolution, and sync state.
 *
 * Local-First Flow:
 * 1. Events are created locally immediately
 * 2. Marked as 'pending'
 * 3. Background sync picks them up
 * 4. On success: mark as 'synced'
 * 5. On failure: mark as 'failed', schedule retry
 */

import type { Event } from "../../domain/models/Event";

// ============================================================================
// SYNC STATE
// ============================================================================

/**
 * Current state of the sync engine
 */
export enum SyncState {
  IDLE = "idle", // Not syncing, no pending events
  SYNCING = "syncing", // Currently syncing
  PAUSED = "paused", // Syncing paused (e.g., no network)
  ERROR = "error", // Last sync failed
}

/**
 * Sync statistics
 */
export interface SyncStats {
  lastSyncAt?: number;
  lastSyncDuration?: number;
  totalSynced: number;
  totalFailed: number;
  pendingCount: number;
  failedCount: number;
  consecutiveFailures: number;
}

/**
 * Sync result for a batch
 */
export interface SyncResult {
  success: boolean;
  syncedEvents: Event[];
  failedEvents: Array<{
    event: Event;
    error: string;
    retryable: boolean;
  }>;
  conflicts: Array<{
    event: Event;
    conflictType: "version" | "content" | "deletion";
    resolution?: "local" | "remote" | "merged";
  }>;
  duration: number;
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Conflict resolution strategy
 */
export enum ConflictStrategy {
  LOCAL_WINS = "local_wins", // Always use local version
  REMOTE_WINS = "remote_wins", // Always use remote version
  LAST_WRITE_WINS = "last_write_wins", // Use most recent timestamp
  MANUAL = "manual", // Require manual resolution
}

/**
 * Conflict resolver function
 */
export type ConflictResolver = (
  localEvent: Event,
  remoteEvent: Event
) => Promise<{
  resolution: "local" | "remote" | "merged";
  resolvedEvent: Event;
}>;

// ============================================================================
// SYNC ENGINE INTERFACE
// ============================================================================

/**
 * Sync engine operations
 */
export interface ISyncEngine {
  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Start the sync engine
   * Begins background synchronization
   */
  start(): Promise<void>;

  /**
   * Stop the sync engine
   * Cancels ongoing sync and stops background tasks
   */
  stop(): Promise<void>;

  /**
   * Trigger an immediate sync
   * Forces sync even if one is in progress
   */
  syncNow(): Promise<SyncResult>;

  /**
   * Sync a specific batch of events
   */
  syncEvents(events: Event[]): Promise<SyncResult>;

  /**
   * Pause syncing (e.g., when offline)
   */
  pause(): void;

  /**
   * Resume syncing (e.g., when back online)
   */
  resume(): Promise<void>;

  // ============================================================================
  // STATE & STATS
  // ============================================================================

  /**
   * Get current sync state
   */
  getState(): SyncState;

  /**
   * Get sync statistics
   */
  getStats(): SyncStats;

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean;

  /**
   * Check if sync is paused
   */
  isPaused(): boolean;

  // ============================================================================
  // CONFLICT MANAGEMENT
  // ============================================================================

  /**
   * Set conflict resolution strategy
   */
  setConflictStrategy(strategy: ConflictStrategy): void;

  /**
   * Set custom conflict resolver
   */
  setConflictResolver(resolver: ConflictResolver): void;

  /**
   * Get pending conflicts that need manual resolution
   */
  getPendingConflicts(): Promise<Event[]>;

  /**
   * Resolve a conflict manually
   */
  resolveConflict(
    eventId: string,
    resolution: "local" | "remote" | "merged",
    resolvedData?: any
  ): Promise<void>;

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  /**
   * Retry failed events
   */
  retryFailedEvents(): Promise<SyncResult>;

  /**
   * Retry a specific event
   */
  retryEvent(eventId: string): Promise<SyncResult>;

  /**
   * Clear retry queue
   */
  clearRetryQueue(): Promise<void>;

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to sync state changes
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: SyncState) => void): () => void;

  /**
   * Subscribe to sync stats changes
   * @returns Unsubscribe function
   */
  onStatsChange(callback: (stats: SyncStats) => void): () => void;

  /**
   * Subscribe to sync completion
   * @returns Unsubscribe function
   */
  onSyncComplete(callback: (result: SyncResult) => void): () => void;

  /**
   * Subscribe to sync errors
   * @returns Unsubscribe function
   */
  onSyncError(callback: (error: Error) => void): () => void;
}

// ============================================================================
// SYNC ENGINE CONFIGURATION
// ============================================================================

/**
 * Sync engine configuration
 */
export interface SyncEngineConfig {
  /**
   * API endpoint for syncing events
   */
  apiEndpoint: string;

  /**
   * API authentication token
   */
  apiToken?: string;

  /**
   * Batch size for syncing (number of events per batch)
   * @default 50
   */
  batchSize?: number;

  /**
   * Sync interval in milliseconds (0 = manual only)
   * @default 30000 (30 seconds)
   */
  syncInterval?: number;

  /**
   * Maximum retry attempts for failed syncs
   * @default 3
   */
  maxRetryAttempts?: number;

  /**
   * Retry delay in milliseconds (exponential backoff)
   * @default 5000 (5 seconds)
   */
  retryDelay?: number;

  /**
   * Enable exponential backoff for retries
   * @default true
   */
  exponentialBackoff?: boolean;

  /**
   * Conflict resolution strategy
   * @default ConflictStrategy.LAST_WRITE_WINS
   */
  conflictStrategy?: ConflictStrategy;

  /**
   * Custom conflict resolver
   */
  conflictResolver?: ConflictResolver;

  /**
   * Sync only when on WiFi
   * @default false
   */
  wifiOnly?: boolean;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

// ============================================================================
// REMOTE API INTERFACE
// ============================================================================

/**
 * Remote API for syncing events
 * This is what the sync engine talks to
 */
export interface IRemoteEventAPI {
  /**
   * Push events to remote server
   */
  pushEvents(events: Event[]): Promise<{
    success: boolean;
    syncedIds: string[];
    conflicts: Array<{
      eventId: string;
      remoteEvent: Event;
    }>;
    errors: Array<{
      eventId: string;
      error: string;
    }>;
  }>;

  /**
   * Pull events from remote server
   * For future bidirectional sync
   */
  pullEvents(since?: number): Promise<Event[]>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Sync engine factory function type
 */
export type SyncEngineFactory = (
  config: SyncEngineConfig
) => Promise<ISyncEngine>;
