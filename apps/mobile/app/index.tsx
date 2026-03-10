import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { YStack, Text, Spinner } from "tamagui";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
        <Text marginTop="$4" color="$foregroundMuted">
          Loading...
        </Text>
      </YStack>
    );
  }

  // Redirect based on auth state
  if (isSignedIn) {
    return <Redirect href="/(tabs)/discover" />;
  }

  // If not signed in, redirect to sign in page (or show landing)
  return <Redirect href="/sign-in" />;
}
