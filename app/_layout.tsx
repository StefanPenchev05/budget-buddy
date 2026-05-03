import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useMoneyTracker } from "@/src/composition/use-money-tracker";
import { SnackbarProvider } from "@/src/shared/feedback/snackbar";
import { palette } from "@/src/shared/theme/design-tokens";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initializeMoneyTracker = useMoneyTracker((state) => state.initialize);

  useEffect(() => {
    initializeMoneyTracker();
  }, [initializeMoneyTracker]);

  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: palette.background,
          card: palette.surface,
          border: palette.border,
          primary: palette.primary,
          text: palette.text,
        },
      }}
    >
      <SnackbarProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="light" />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
