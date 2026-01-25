import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Event,
  EventType,
  DomainEventType,
  SyncEventType,
  SystemEventType,
  ItemCreatedPayload,
  ItemUpdatedPayload,
  ItemDeletedPayload,
  SyncStartedPayload,
  SyncSuccessPayload,
  SyncFailedPayload,
  ConflictDetectedPayload,
  ConflictResolvedPayload,
  AppForegroundPayload,
  NetworkOnlinePayload,
} from '@/src/domain/models/Event';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { formatTime } from '@/src/ui/utils/dateFormatters';
import { EventTypeIcon } from './EventTypeIcon';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
}

function formatEventType(type: EventType): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEventDescription(event: Event): string {
  const { type, payload } = event;

  switch (type) {
    // Domain events
    case DomainEventType.ITEM_CREATED: {
      const p = payload as ItemCreatedPayload;
      return `Created item: ${p.item?.title ?? 'Unknown'}`;
    }
    case DomainEventType.ITEM_UPDATED: {
      const p = payload as ItemUpdatedPayload;
      const changedFields = p.changes ? Object.keys(p.changes).join(', ') : '';
      return `Updated item ${p.itemId}${changedFields ? `: ${changedFields}` : ''}`;
    }
    case DomainEventType.ITEM_DELETED: {
      const p = payload as ItemDeletedPayload;
      return `Deleted item: ${p.deletedItem?.title ?? p.itemId}`;
    }

    // Sync events
    case SyncEventType.SYNC_STARTED: {
      const p = payload as SyncStartedPayload;
      return `Sync started with ${p.batchSize} item${p.batchSize !== 1 ? 's' : ''}`;
    }
    case SyncEventType.SYNC_SUCCESS: {
      const p = payload as SyncSuccessPayload;
      return `Synced ${p.syncedCount} item${p.syncedCount !== 1 ? 's' : ''} in ${p.duration}ms`;
    }
    case SyncEventType.SYNC_FAILED: {
      const p = payload as SyncFailedPayload;
      return `Sync failed: ${p.error}`;
    }
    case SyncEventType.CONFLICT_DETECTED: {
      const p = payload as ConflictDetectedPayload;
      return `Conflict detected: ${p.conflictType}`;
    }
    case SyncEventType.CONFLICT_RESOLVED: {
      const p = payload as ConflictResolvedPayload;
      return `Conflict resolved: ${p.resolution}`;
    }

    // System events
    case SystemEventType.APP_BACKGROUND:
      return 'App moved to background';
    case SystemEventType.APP_FOREGROUND: {
      const p = payload as AppForegroundPayload;
      const duration = p.backgroundDuration
        ? ` after ${Math.round(p.backgroundDuration / 1000)}s`
        : '';
      return `App resumed${duration}`;
    }
    case SystemEventType.NETWORK_ONLINE: {
      const p = payload as NetworkOnlinePayload;
      return `Network connected${p.connectionType ? ` (${p.connectionType})` : ''}`;
    }
    case SystemEventType.NETWORK_OFFLINE:
      return 'Network disconnected';

    default:
      return formatEventType(type);
  }
}

export function EventCard({ event, onPress }: EventCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    onPress?.(event);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow,
        },
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <EventTypeIcon type={event.type} />
        <View style={styles.headerContent}>
          <Text style={[styles.eventType, { color: colors.text.primary }]}>
            {formatEventType(event.type)}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text.secondary }]}>
            {formatTime(event.timestamp)}
          </Text>
        </View>
        <SyncStatusIndicator status={event.status} />
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <Text
        style={[styles.description, { color: colors.text.secondary }]}
        numberOfLines={2}
      >
        {getEventDescription(event)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
