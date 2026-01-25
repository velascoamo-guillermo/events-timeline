import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Event Timeline",
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="create-event"
          options={{
            title: "Create Event",
            presentation: "modal",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
