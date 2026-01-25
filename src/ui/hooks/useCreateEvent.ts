import { useCallback } from 'react';
import {
  DomainEventType,
  SyncEventType,
  SystemEventType,
  EventType,
} from '@/src/domain/models/Event';
import { WatermelonEventStore } from '@/src/infrastructure/db/WatermelonEventStore';

const eventStore = new WatermelonEventStore();

function buildQuickPayload(type: EventType) {
  const now = Date.now();
  const itemId = `item-${now}`;

  switch (type) {
    case DomainEventType.ITEM_CREATED:
      return {
        item: {
          id: itemId,
          title: `Item ${new Date().toLocaleTimeString()}`,
          createdAt: now,
          updatedAt: now,
        },
      };
    case DomainEventType.ITEM_UPDATED:
      return {
        itemId,
        changes: { title: 'Updated Title' },
        previousValues: { title: 'Old Title' },
      };
    case DomainEventType.ITEM_DELETED:
      return {
        itemId,
        deletedItem: {
          id: itemId,
          title: 'Deleted Item',
          createdAt: now - 86400000,
          updatedAt: now,
        },
      };
    case SyncEventType.SYNC_STARTED:
      return { batchSize: Math.floor(Math.random() * 10) + 1, startTime: now };
    case SyncEventType.SYNC_SUCCESS:
      return {
        syncedCount: Math.floor(Math.random() * 10) + 1,
        duration: Math.floor(Math.random() * 2000) + 500,
        endTime: now,
      };
    case SyncEventType.SYNC_FAILED:
      return { error: 'Connection timeout', retryCount: 1 };
    case SyncEventType.CONFLICT_DETECTED:
      return { eventId: itemId, conflictType: 'version', localData: {}, remoteData: {} };
    case SyncEventType.CONFLICT_RESOLVED:
      return { eventId: itemId, resolution: 'local', resolvedData: {} };
    case SystemEventType.APP_BACKGROUND:
      return { timestamp: now };
    case SystemEventType.APP_FOREGROUND:
      return { timestamp: now, backgroundDuration: 30000 };
    case SystemEventType.NETWORK_ONLINE:
      return { timestamp: now, connectionType: 'wifi' };
    case SystemEventType.NETWORK_OFFLINE:
      return { timestamp: now };
    default:
      return {};
  }
}

export function useCreateEvent() {
  const createQuickEvent = useCallback(
    async (type: DomainEventType | SyncEventType | SystemEventType) => {
      await eventStore.createEvent({
        type,
        payload: buildQuickPayload(type),
      });
    },
    []
  );

  return { createQuickEvent };
}
