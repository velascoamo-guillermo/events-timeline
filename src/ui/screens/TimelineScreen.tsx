import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { TimelineList } from '@/src/ui/components/timeline/TimelineList';
import { EmptyState } from '@/src/ui/components/timeline/EmptyState';
import { FloatingActionButton } from '@/src/ui/components/timeline/FloatingActionButton';
import { useTimelineEvents } from '@/src/ui/hooks/useTimelineEvents';
import { useEventTracker } from '@/src/ui/hooks/useEventTracker';

export function TimelineScreen() {
  const { colors } = useTheme();
  const { sections, isLoading, error, refresh } = useTimelineEvents();

  // Start auto-tracking app lifecycle and network events
  useEventTracker();

  const renderFAB = () => <FloatingActionButton />;

  if (isLoading && sections.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
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
        edges={['bottom']}
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
        edges={['bottom']}
      >
        <EmptyState />
        {renderFAB()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <TimelineList
        sections={sections}
        onRefresh={refresh}
        isRefreshing={isLoading}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
