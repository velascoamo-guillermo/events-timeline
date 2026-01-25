import { useTheme } from "@/src/ui/hooks/useTheme";
import { StyleSheet, Text, View } from "react-native";

interface DateSectionHeaderProps {
  title: string;
}

export function DateSectionHeader({ title }: DateSectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.indicator, { backgroundColor: colors.indicator }]} />
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
});
