import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { SystemEventType } from '@/src/domain/models/Event';
import { WatermelonEventStore } from '@/src/infrastructure/db/WatermelonEventStore';

class EventTrackerService {
  private eventStore: WatermelonEventStore;
  private isTracking = false;
  private appStateSubscription: { remove: () => void } | null = null;
  private netInfoSubscription: (() => void) | null = null;
  private lastAppState: AppStateStatus = 'active';
  private backgroundTimestamp: number | null = null;
  private lastNetworkState: boolean | null = null;

  constructor() {
    this.eventStore = new WatermelonEventStore();
  }

  startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track app state changes
    this.lastAppState = AppState.currentState;
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    // Track network changes
    this.netInfoSubscription = NetInfo.addEventListener(
      this.handleNetworkChange
    );

    // Get initial network state
    NetInfo.fetch().then((state) => {
      this.lastNetworkState = state.isConnected;
    });
  }

  stopTracking() {
    if (!this.isTracking) return;
    this.isTracking = false;

    this.appStateSubscription?.remove();
    this.appStateSubscription = null;

    this.netInfoSubscription?.();
    this.netInfoSubscription = null;
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const now = Date.now();

    if (
      this.lastAppState === 'active' &&
      (nextAppState === 'background' || nextAppState === 'inactive')
    ) {
      // App going to background
      this.backgroundTimestamp = now;
      await this.eventStore.createEvent({
        type: SystemEventType.APP_BACKGROUND,
        payload: { timestamp: now },
      });
    } else if (
      (this.lastAppState === 'background' || this.lastAppState === 'inactive') &&
      nextAppState === 'active'
    ) {
      // App coming to foreground
      const backgroundDuration = this.backgroundTimestamp
        ? now - this.backgroundTimestamp
        : 0;
      await this.eventStore.createEvent({
        type: SystemEventType.APP_FOREGROUND,
        payload: {
          timestamp: now,
          backgroundDuration,
        },
      });
      this.backgroundTimestamp = null;
    }

    this.lastAppState = nextAppState;
  };

  private handleNetworkChange = async (state: NetInfoState) => {
    const isConnected = state.isConnected;
    const now = Date.now();

    // Skip if this is the first state or no change
    if (this.lastNetworkState === null) {
      this.lastNetworkState = isConnected;
      return;
    }

    if (isConnected === this.lastNetworkState) return;

    if (isConnected) {
      // Network came online
      let connectionType: 'wifi' | 'cellular' | 'unknown' = 'unknown';
      if (state.type === 'wifi') connectionType = 'wifi';
      else if (state.type === 'cellular') connectionType = 'cellular';

      await this.eventStore.createEvent({
        type: SystemEventType.NETWORK_ONLINE,
        payload: {
          timestamp: now,
          connectionType,
        },
      });
    } else {
      // Network went offline
      await this.eventStore.createEvent({
        type: SystemEventType.NETWORK_OFFLINE,
        payload: { timestamp: now },
      });
    }

    this.lastNetworkState = isConnected;
  };
}

// Singleton instance
export const eventTracker = new EventTrackerService();
