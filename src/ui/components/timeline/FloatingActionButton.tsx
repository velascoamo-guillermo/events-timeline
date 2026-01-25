import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/ui/hooks/useTheme';
import {
  DomainEventType,
  SyncEventType,
  SystemEventType,
} from '@/src/domain/models/Event';

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: DomainEventType | SyncEventType | SystemEventType;
  category: 'domain' | 'sync' | 'system';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Item Created',
    icon: 'add-circle-outline',
    type: DomainEventType.ITEM_CREATED,
    category: 'domain',
  },
  {
    label: 'Item Updated',
    icon: 'create-outline',
    type: DomainEventType.ITEM_UPDATED,
    category: 'domain',
  },
  {
    label: 'Sync Success',
    icon: 'cloud-done-outline',
    type: SyncEventType.SYNC_SUCCESS,
    category: 'sync',
  },
  {
    label: 'Sync Failed',
    icon: 'cloud-offline-outline',
    type: SyncEventType.SYNC_FAILED,
    category: 'sync',
  },
];

interface FloatingActionButtonProps {
  onQuickAction: (type: DomainEventType | SyncEventType | SystemEventType) => void;
  onOpenForm: () => void;
}

export function FloatingActionButton({
  onQuickAction,
  onOpenForm,
}: FloatingActionButtonProps) {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickAction = (type: DomainEventType | SyncEventType | SystemEventType) => {
    setIsOpen(false);
    onQuickAction(type);
  };

  const handleOpenForm = () => {
    setIsOpen(false);
    onOpenForm();
  };

  const getCategoryColor = (category: 'domain' | 'sync' | 'system') => {
    return colors.eventCategory[category];
  };

  return (
    <>
      <Pressable
        style={[styles.fab, { backgroundColor: colors.indicator }]}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.menuTitle, { color: colors.text.primary }]}>
              Add Event
            </Text>

            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action.type}
                  style={[
                    styles.quickActionButton,
                    {
                      backgroundColor: getCategoryColor(action.category) + '15',
                      borderColor: getCategoryColor(action.category) + '30',
                    },
                  ]}
                  onPress={() => handleQuickAction(action.type)}
                >
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={getCategoryColor(action.category)}
                  />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: colors.text.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <Pressable
              style={[
                styles.customButton,
                { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
              ]}
              onPress={handleOpenForm}
            >
              <Ionicons
                name="create"
                size={20}
                color={colors.indicator}
              />
              <Text style={[styles.customButtonText, { color: colors.indicator }]}>
                Create Custom Event
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.indicator}
              />
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={[styles.cancelText, { color: colors.text.secondary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  customButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
