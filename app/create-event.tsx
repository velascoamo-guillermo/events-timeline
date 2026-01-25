import {
  DomainEventType,
  EventType,
  SyncEventType,
  SystemEventType,
} from "@/src/domain/models/Event";
import { WatermelonEventStore } from "@/src/infrastructure/db/WatermelonEventStore";
import { useTheme } from "@/src/ui/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EventCategory = "domain" | "sync" | "system";

interface EventTypeOption {
  type: EventType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: EventCategory;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  // Domain events
  {
    type: DomainEventType.ITEM_CREATED,
    label: "Item Created",
    icon: "add-circle-outline",
    category: "domain",
  },
  {
    type: DomainEventType.ITEM_UPDATED,
    label: "Item Updated",
    icon: "create-outline",
    category: "domain",
  },
  {
    type: DomainEventType.ITEM_DELETED,
    label: "Item Deleted",
    icon: "trash-outline",
    category: "domain",
  },
  // Sync events
  {
    type: SyncEventType.SYNC_STARTED,
    label: "Sync Started",
    icon: "sync-outline",
    category: "sync",
  },
  {
    type: SyncEventType.SYNC_SUCCESS,
    label: "Sync Success",
    icon: "cloud-done-outline",
    category: "sync",
  },
  {
    type: SyncEventType.SYNC_FAILED,
    label: "Sync Failed",
    icon: "cloud-offline-outline",
    category: "sync",
  },
  {
    type: SyncEventType.CONFLICT_DETECTED,
    label: "Conflict Detected",
    icon: "git-compare-outline",
    category: "sync",
  },
  {
    type: SyncEventType.CONFLICT_RESOLVED,
    label: "Conflict Resolved",
    icon: "checkmark-done-outline",
    category: "sync",
  },
  // System events
  {
    type: SystemEventType.APP_BACKGROUND,
    label: "App Background",
    icon: "phone-portrait-outline",
    category: "system",
  },
  {
    type: SystemEventType.APP_FOREGROUND,
    label: "App Foreground",
    icon: "phone-portrait",
    category: "system",
  },
  {
    type: SystemEventType.NETWORK_ONLINE,
    label: "Network Online",
    icon: "wifi-outline",
    category: "system",
  },
  {
    type: SystemEventType.NETWORK_OFFLINE,
    label: "Network Offline",
    icon: "cellular-outline",
    category: "system",
  },
];

const eventStore = new WatermelonEventStore();

export default function CreateEventScreen() {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = EVENT_TYPE_OPTIONS.find(
    (opt) => opt.type === selectedType,
  );

  const getCategoryColor = (category: EventCategory) =>
    colors.eventCategory[category];

  const buildPayload = () => {
    if (!selectedType) return {};

    const now = Date.now();
    const itemId = `item-${now}`;

    switch (selectedType) {
      case DomainEventType.ITEM_CREATED:
        return {
          item: {
            id: itemId,
            title: title || "New Item",
            description: description || undefined,
            createdAt: now,
            updatedAt: now,
          },
        };
      case DomainEventType.ITEM_UPDATED:
        return {
          itemId,
          changes: { title: title || "Updated Title" },
          previousValues: { title: "Old Title" },
        };
      case DomainEventType.ITEM_DELETED:
        return {
          itemId,
          deletedItem: {
            id: itemId,
            title: title || "Deleted Item",
            createdAt: now - 86400000,
            updatedAt: now,
          },
        };
      case SyncEventType.SYNC_STARTED:
        return { batchSize: 5, startTime: now };
      case SyncEventType.SYNC_SUCCESS:
        return { syncedCount: 5, duration: 1234, endTime: now };
      case SyncEventType.SYNC_FAILED:
        return { error: description || "Connection timeout", retryCount: 1 };
      case SyncEventType.CONFLICT_DETECTED:
        return {
          eventId: itemId,
          conflictType: "version",
          localData: {},
          remoteData: {},
        };
      case SyncEventType.CONFLICT_RESOLVED:
        return { eventId: itemId, resolution: "local", resolvedData: {} };
      case SystemEventType.APP_BACKGROUND:
        return { timestamp: now };
      case SystemEventType.APP_FOREGROUND:
        return { timestamp: now, backgroundDuration: 30000 };
      case SystemEventType.NETWORK_ONLINE:
        return { timestamp: now, connectionType: "wifi" };
      case SystemEventType.NETWORK_OFFLINE:
        return { timestamp: now };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert("Error", "Please select an event type");
      return;
    }

    setIsSubmitting(true);
    try {
      await eventStore.createEvent({
        type: selectedType,
        payload: buildPayload(),
      });
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showTitleInput =
    selectedType &&
    [
      DomainEventType.ITEM_CREATED,
      DomainEventType.ITEM_UPDATED,
      DomainEventType.ITEM_DELETED,
    ].includes(selectedType as DomainEventType);

  const showDescriptionInput =
    selectedType &&
    [DomainEventType.ITEM_CREATED, SyncEventType.SYNC_FAILED].includes(
      selectedType as DomainEventType | SyncEventType,
    );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Event",
          headerBackTitle: "Cancel",
        }}
      />
      <SafeAreaView style={[styles.container]} edges={["bottom"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Event Type
          </Text>
          <View style={styles.typeGrid}>
            {EVENT_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedType === option.type;
              const categoryColor = getCategoryColor(option.category);

              return (
                <Pressable
                  key={option.type}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: isSelected
                        ? categoryColor + "20"
                        : colors.cardBackground,
                      borderColor: isSelected ? categoryColor : colors.divider,
                    },
                  ]}
                  onPress={() => setSelectedType(option.type)}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={isSelected ? categoryColor : colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color: isSelected
                          ? categoryColor
                          : colors.text.secondary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showTitleInput && (
            <>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.divider,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="Enter item title"
                placeholderTextColor={colors.text.tertiary}
                value={title}
                onChangeText={setTitle}
              />
            </>
          )}

          {showDescriptionInput && (
            <>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                {selectedType === SyncEventType.SYNC_FAILED
                  ? "Error Message"
                  : "Description"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.divider,
                    color: colors.text.primary,
                  },
                ]}
                placeholder={
                  selectedType === SyncEventType.SYNC_FAILED
                    ? "Enter error message"
                    : "Enter description (optional)"
                }
                placeholderTextColor={colors.text.tertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          <View style={styles.footer}>
            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedType
                    ? colors.indicator
                    : colors.text.tertiary,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selectedType || isSubmitting}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? "Creating..." : "Create Event"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeButton: {
    width: "31%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  footer: {
    marginTop: 24,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
