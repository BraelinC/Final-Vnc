import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { TamaguiProvider, Theme } from "tamagui";

import config from "../tamagui.config";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Clerk token cache using SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Handle save error silently
    }
  },
};

// Get publishable key from environment
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load Inter fonts
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Regular.otf"),
    InterMedium: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterSemiBold: require("@tamagui/font-inter/otf/Inter-SemiBold.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Warn if Clerk key is missing
  if (!publishableKey) {
    console.warn(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Authentication will not work."
    );
  }

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
      <Theme name={colorScheme === "dark" ? "dark" : "light"}>
        <ClerkProvider
          publishableKey={publishableKey ?? ""}
          tokenCache={tokenCache}
        >
          <ClerkLoaded>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="recipe/[id]"
                options={{
                  presentation: "card",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="cookbook/[id]"
                options={{
                  presentation: "card",
                }}
              />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </ClerkLoaded>
        </ClerkProvider>
      </Theme>
    </TamaguiProvider>
  );
}
