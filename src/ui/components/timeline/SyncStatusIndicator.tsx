import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncStatus } from '@/src/domain/models/Event';
import { useTheme } from '@/src/ui/hooks/useTheme';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  size?: 'small' | 'medium';
}

export function SyncStatusIndicator({
  status,
  size = 'small',
}: SyncStatusIndicatorProps) {
  const { colors } = useTheme();

  const statusConfig = {
    [SyncStatus.PENDING]: {
      icon: 'time-outline' as const,
      color: colors.syncStatus.pending,
    },
    [SyncStatus.SYNCED]: {
      icon: 'checkmark-circle' as const,
      color: colors.syncStatus.synced,
    },
    [SyncStatus.FAILED]: {
      icon: 'alert-circle' as const,
      color: colors.syncStatus.failed,
    },
  };

  const config = statusConfig[status];
  const iconSize = size === 'small' ? 16 : 20;
  const containerSize = size === 'small' ? 24 : 28;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.color + '20',
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
