import { useTheme } from "@/src/ui/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export function FloatingActionButton() {
  const { colors } = useTheme();

  return (
    <Pressable onPress={() => router.push("/add-event")}>
      <GlassView
        style={[styles.fab, { backgroundColor: colors.indicator }]}
        glassEffectStyle="regular"
      >
        <Ionicons name="add" size={28} color={"#fff"} />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
