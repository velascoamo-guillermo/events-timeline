import {
  DomainEventType,
  SyncEventType,
  SystemEventType,
} from "@/src/domain/models/Event";
import { useCreateEvent } from "@/src/ui/hooks/useCreateEvent";
import { useTheme } from "@/src/ui/hooks/useTheme";
import { useTimelineEvents } from "@/src/ui/hooks/useTimelineEvents";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: DomainEventType | SyncEventType | SystemEventType;
  category: "domain" | "sync" | "system";
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Item Created",
    icon: "add-circle-outline",
    type: DomainEventType.ITEM_CREATED,
    category: "domain",
  },
  {
    label: "Item Updated",
    icon: "create-outline",
    type: DomainEventType.ITEM_UPDATED,
    category: "domain",
  },
  {
    label: "Sync Success",
    icon: "cloud-done-outline",
    type: SyncEventType.SYNC_SUCCESS,
    category: "sync",
  },
  {
    label: "Sync Failed",
    icon: "cloud-offline-outline",
    type: SyncEventType.SYNC_FAILED,
    category: "sync",
  },
];

export default function AddEventScreen() {
  const { colors } = useTheme();
  const { createQuickEvent } = useCreateEvent();
  const { refresh } = useTimelineEvents();

  const handleQuickAction = async (
    type: DomainEventType | SyncEventType | SystemEventType,
  ) => {
    await createQuickEvent(type);
    await refresh();
    router.back();
  };

  const handleOpenForm = () => {
    router.replace("/create-event");
  };

  const getCategoryColor = (category: "domain" | "sync" | "system") => {
    return colors.eventCategory[category];
  };

  return (
    <View style={[styles.container]}>
      <Text style={[styles.menuTitle, { color: colors.text.primary }]}>
        Add Event
      </Text>

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.type}
            onPress={() => handleQuickAction(action.type)}
          >
            <GlassView
              style={styles.quickActionButton}
              glassEffectStyle="regular"
              isInteractive
            >
              <Ionicons
                name={action.icon}
                size={24}
                color={getCategoryColor(action.category)}
              />
              <Text
                style={[
                  styles.quickActionLabel,
                  { color: getCategoryColor(action.category) },
                ]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
            </GlassView>
          </Pressable>
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <Pressable onPress={handleOpenForm}>
        <GlassView
          style={styles.customButton}
          glassEffectStyle="regular"
          isInteractive
        >
          <Ionicons name="create" size={20} color={colors.indicator} />
          <Text style={[styles.customButtonText, { color: colors.indicator }]}>
            Create Custom Event
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.indicator} />
        </GlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    overflow: "hidden",
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    overflow: "hidden",
  },
  customButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
