import { StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/ui/hooks/useTheme';

export function FloatingActionButton() {
  const { colors } = useTheme();

  return (
    <Pressable onPress={() => router.push('/add-event')}>
      <GlassView style={styles.fab} glassEffectStyle="regular" isInteractive>
        <Ionicons name="add" size={28} color={colors.indicator} />
      </GlassView>
    </Pressable>
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
    overflow: 'hidden',
  },
});
