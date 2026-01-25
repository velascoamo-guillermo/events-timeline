import { useTheme } from "@/src/ui/hooks/useTheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const isIOS = Platform.OS === "ios";

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerTransparent: isIOS,
          headerBlurEffect: isLiquidGlassAvailable()
            ? undefined
            : "systemMaterial",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Event Timeline",
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="add-event"
          options={{
            title: "Add Event",
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: "fitToContents",
            headerShown: false,
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
            },
          }}
        />
        <Stack.Screen
          name="create-event"
          options={{
            title: "Create Event",
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.8],
            headerLargeTitleShadowVisible: false,
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
            },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
