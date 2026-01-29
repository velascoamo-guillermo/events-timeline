import { EmptyState } from "@/src/ui/components/timeline/EmptyState";
import { FloatingActionButton } from "@/src/ui/components/timeline/FloatingActionButton";
import { TimelineList } from "@/src/ui/components/timeline/TimelineList";
import { useEventTracker } from "@/src/ui/hooks/useEventTracker";
import { useSyncEngine } from "@/src/ui/hooks/useSyncEngine";
import { useTheme } from "@/src/ui/hooks/useTheme";
import { useTimelineEvents } from "@/src/ui/hooks/useTimelineEvents";
import { SyncState } from "@/src/infrastructure/sync/SyncEngine";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export function TimelineScreen() {
  const { colors } = useTheme();
  const { sections, isLoading, error, refresh } = useTimelineEvents();
  const { syncState, syncStats, syncNow, isOnline } = useSyncEngine();

  // Start auto-tracking app lifecycle and network events
  useEventTracker();

  const handleRefresh = async () => {
    refresh();
    await syncNow();
  };

  const getSyncStatusConfig = () => {
    if (!isOnline) {
      return { icon: "cloud-offline-outline" as const, color: colors.text.secondary, label: "Offline" };
    }
    switch (syncState) {
      case SyncState.SYNCING:
        return { icon: "sync-outline" as const, color: colors.indicator, label: "Syncing..." };
      case SyncState.ERROR:
        return { icon: "alert-circle-outline" as const, color: colors.syncStatus.failed, label: "Sync failed" };
      case SyncState.PAUSED:
        return { icon: "pause-circle-outline" as const, color: colors.text.secondary, label: "Paused" };
      default:
        return { icon: "checkmark-circle-outline" as const, color: colors.syncStatus.synced, label: "Synced" };
    }
  };

  const statusConfig = getSyncStatusConfig();

  const renderSyncHeader = () => (
    <Pressable onPress={syncNow} style={styles.syncHeader}>
      <View style={styles.syncStatusRow}>
        <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
        <Text style={[styles.syncStatusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
        {syncStats.pendingCount > 0 && (
          <Text style={[styles.pendingBadge, { backgroundColor: colors.indicator + "20", color: colors.indicator }]}>
            {syncStats.pendingCount} pending
          </Text>
        )}
      </View>
    </Pressable>
  );

  const renderFAB = () => <FloatingActionButton />;

  if (isLoading && sections.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.indicator} />
        </View>
        {renderFAB()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.syncStatus.failed }]}>
            {error.message}
          </Text>
        </View>
        {renderFAB()}
      </SafeAreaView>
    );
  }

  if (sections.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <EmptyState />
        {renderFAB()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={[]}
    >
      <TimelineList
        sections={sections}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        ListHeaderComponent={renderSyncHeader()}
      />
      {renderFAB()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  syncHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  syncStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncStatusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  pendingBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
    overflow: "hidden",
  },
});
