import { useEffect, useState, useRef, useCallback } from "react";
import { SyncEngineImpl } from "@/src/infrastructure/sync/SyncEngineImpl";
import { eventTracker } from "@/src/infrastructure/tracking/EventTracker";
import type { SyncState, SyncStats, SyncResult } from "@/src/infrastructure/sync/SyncEngine";
import { SyncState as SyncStateEnum } from "@/src/infrastructure/sync/SyncEngine";

export interface UseSyncEngineOptions {
  autoStart?: boolean;
  syncInterval?: number;
  debug?: boolean;
}

export interface UseSyncEngineReturn {
  syncState: SyncState;
  syncStats: SyncStats;
  isSyncing: boolean;
  isPaused: boolean;
  isOnline: boolean;
  syncNow: () => Promise<SyncResult>;
  retryFailed: () => Promise<SyncResult>;
  lastError: Error | null;
}

const defaultStats: SyncStats = {
  totalSynced: 0,
  totalFailed: 0,
  pendingCount: 0,
  failedCount: 0,
  consecutiveFailures: 0,
};

export function useSyncEngine(options: UseSyncEngineOptions = {}): UseSyncEngineReturn {
  const { autoStart = true, syncInterval = 30000, debug = __DEV__ } = options;

  const engineRef = useRef<SyncEngineImpl | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(SyncStateEnum.IDLE);
  const [syncStats, setSyncStats] = useState<SyncStats>(defaultStats);
  const [isOnline, setIsOnline] = useState(eventTracker.isOnline());
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    const engine = new SyncEngineImpl({
      syncInterval,
      debug,
    });
    engineRef.current = engine;

    // Subscribe to state changes
    const unsubState = engine.onStateChange(setSyncState);
    const unsubStats = engine.onStatsChange(setSyncStats);
    const unsubError = engine.onSyncError(setLastError);

    // Subscribe to network state changes for auto pause/resume
    const unsubNetwork = eventTracker.onNetworkStateChange((connected) => {
      setIsOnline(connected);
      if (connected) {
        engine.resume();
      } else {
        engine.pause();
      }
    });

    // Auto-start if enabled
    if (autoStart) {
      engine.start();
    }

    return () => {
      unsubState();
      unsubStats();
      unsubError();
      unsubNetwork();
      engine.stop();
    };
  }, [autoStart, syncInterval, debug]);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!engineRef.current) {
      return {
        success: false,
        syncedEvents: [],
        failedEvents: [],
        conflicts: [],
        duration: 0,
      };
    }
    return engineRef.current.syncNow();
  }, []);

  const retryFailed = useCallback(async (): Promise<SyncResult> => {
    if (!engineRef.current) {
      return {
        success: false,
        syncedEvents: [],
        failedEvents: [],
        conflicts: [],
        duration: 0,
      };
    }
    return engineRef.current.retryFailedEvents();
  }, []);

  return {
    syncState,
    syncStats,
    isSyncing: syncState === SyncStateEnum.SYNCING,
    isPaused: syncState === SyncStateEnum.PAUSED,
    isOnline,
    syncNow,
    retryFailed,
    lastError,
  };
}
