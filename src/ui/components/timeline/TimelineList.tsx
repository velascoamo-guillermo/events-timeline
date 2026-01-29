import type { Event } from "@/src/domain/models/Event";
import { useTheme } from "@/src/ui/hooks/useTheme";
import { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { DateSectionHeader } from "./DateSectionHeader";
import { EventCard } from "./EventCard";

export interface TimelineSection {
  title: string;
  date: string;
  data: Event[];
}

interface TimelineListProps {
  sections: TimelineSection[];
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onEventPress?: (event: Event) => void;
  ListHeaderComponent?: React.ReactElement | null;
}

export function TimelineList({
  sections,
  onRefresh,
  isRefreshing,
  onEventPress,
  ListHeaderComponent,
}: TimelineListProps) {
  const { colors } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard event={item} onPress={onEventPress} />
    ),
    [onEventPress],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: TimelineSection }) => (
      <DateSectionHeader title={title} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Event) => item.id, []);

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.indicator}
        />
      }
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        isRefreshing ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.text.tertiary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
