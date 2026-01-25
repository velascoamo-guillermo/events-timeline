import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerTransparent: true,
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
                : undefined,
            },
          }}
        />
        <Stack.Screen
          name="create-event"
          options={{
            title: "Create Event",
            presentation: "formSheet",
            sheetGrabberVisible: true,
            headerLargeTitleShadowVisible: false,
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : undefined,
            },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
