import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  EventType,
  DomainEventType,
  SyncEventType,
  SystemEventType,
} from '@/src/domain/models/Event';
import { useTheme } from '@/src/ui/hooks/useTheme';

interface EventTypeIconProps {
  type: EventType;
  size?: 'small' | 'medium';
}

type EventCategory = 'domain' | 'sync' | 'system';

interface IconConfig {
  icon: keyof typeof Ionicons.glyphMap;
  category: EventCategory;
}

const EVENT_ICON_MAP: Record<EventType, IconConfig> = {
  // Domain events
  [DomainEventType.ITEM_CREATED]: {
    icon: 'add-circle-outline',
    category: 'domain',
  },
  [DomainEventType.ITEM_UPDATED]: {
    icon: 'create-outline',
    category: 'domain',
  },
  [DomainEventType.ITEM_DELETED]: {
    icon: 'trash-outline',
    category: 'domain',
  },

  // Sync events
  [SyncEventType.SYNC_STARTED]: {
    icon: 'sync-outline',
    category: 'sync',
  },
  [SyncEventType.SYNC_SUCCESS]: {
    icon: 'cloud-done-outline',
    category: 'sync',
  },
  [SyncEventType.SYNC_FAILED]: {
    icon: 'cloud-offline-outline',
    category: 'sync',
  },
  [SyncEventType.CONFLICT_DETECTED]: {
    icon: 'git-compare-outline',
    category: 'sync',
  },
  [SyncEventType.CONFLICT_RESOLVED]: {
    icon: 'checkmark-done-outline',
    category: 'sync',
  },

  // System events
  [SystemEventType.APP_BACKGROUND]: {
    icon: 'phone-portrait-outline',
    category: 'system',
  },
  [SystemEventType.APP_FOREGROUND]: {
    icon: 'phone-portrait',
    category: 'system',
  },
  [SystemEventType.NETWORK_ONLINE]: {
    icon: 'wifi-outline',
    category: 'system',
  },
  [SystemEventType.NETWORK_OFFLINE]: {
    icon: 'cellular-outline',
    category: 'system',
  },
};

export function EventTypeIcon({ type, size = 'medium' }: EventTypeIconProps) {
  const { colors } = useTheme();

  const categoryColors: Record<EventCategory, { background: string; icon: string }> = {
    domain: {
      background: colors.eventCategory.domain + '20',
      icon: colors.eventCategory.domain,
    },
    sync: {
      background: colors.eventCategory.sync + '20',
      icon: colors.eventCategory.sync,
    },
    system: {
      background: colors.eventCategory.system + '20',
      icon: colors.eventCategory.system,
    },
  };

  const config = EVENT_ICON_MAP[type];
  const categoryColor = categoryColors[config.category];
  const iconSize = size === 'small' ? 16 : 20;
  const containerSize = size === 'small' ? 28 : 36;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: categoryColor.background,
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <Ionicons name={config.icon} size={iconSize} color={categoryColor.icon} />
    </View>
  );
}

export function getEventCategory(type: EventType): EventCategory {
  return EVENT_ICON_MAP[type].category;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
