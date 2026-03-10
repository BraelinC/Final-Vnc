import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { LinearGradient } from "@tamagui/linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, Image, useTheme } from "tamagui";
import { Button, Input, Card, GradientCircleIcon } from "@healthymama/ui";

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!signInLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/discover");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded) return;

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" "),
      });

      // Normally you'd verify email here
      // For demo, assume verification is done
      router.replace("/(tabs)/discover");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "oauth_google" | "oauth_apple") => {
    // OAuth implementation would go here
    console.log("OAuth with", provider);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <YStack flex={1} backgroundColor="$background">
        {/* Header gradient */}
        <LinearGradient
          colors={["#dc2626", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          height={280}
          paddingTop={insets.top}
          paddingHorizontal="$6"
          justifyContent="center"
          alignItems="center"
        >
          <GradientCircleIcon
            size="xl"
            colors={["#ffffff", "#fce7f3"]}
            icon={<Ionicons name="restaurant" size={32} color="#ec4899" />}
          />
          <Text
            fontSize={32}
            fontWeight="800"
            color="$white"
            marginTop="$3"
          >
            HealthyMama
          </Text>
          <Text
            fontSize={16}
            color="rgba(255,255,255,0.8)"
            textAlign="center"
          >
            Your personal recipe companion
          </Text>
        </LinearGradient>

        {/* Form */}
        <YStack
          flex={1}
          marginTop={-40}
          backgroundColor="$background"
          borderTopLeftRadius="$7"
          borderTopRightRadius="$7"
          padding="$5"
        >
          {/* Mode toggle */}
          <XStack
            backgroundColor="$gray100"
            borderRadius="$4"
            padding="$1"
            marginBottom="$4"
          >
            <YStack
              flex={1}
              paddingVertical="$2"
              borderRadius="$3"
              alignItems="center"
              backgroundColor={mode === "signin" ? "$background" : "transparent"}
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setMode("signin")}
            >
              <Text
                fontSize={14}
                fontWeight={mode === "signin" ? "600" : "400"}
                color={mode === "signin" ? "$color" : "$foregroundMuted"}
              >
                Sign In
              </Text>
            </YStack>
            <YStack
              flex={1}
              paddingVertical="$2"
              borderRadius="$3"
              alignItems="center"
              backgroundColor={mode === "signup" ? "$background" : "transparent"}
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setMode("signup")}
            >
              <Text
                fontSize={14}
                fontWeight={mode === "signup" ? "600" : "400"}
                color={mode === "signup" ? "$color" : "$foregroundMuted"}
              >
                Sign Up
              </Text>
            </YStack>
          </XStack>

          {/* Error message */}
          {error && (
            <Card variant="flat" marginBottom="$3" backgroundColor="$errorSoft">
              <XStack alignItems="center" gap="$2">
                <Ionicons name="alert-circle" size={20} color={theme.error?.val} />
                <Text fontSize={14} color="$error" flex={1}>
                  {error}
                </Text>
              </XStack>
            </Card>
          )}

          {/* Form fields */}
          <YStack gap="$3">
            {mode === "signup" && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={mode === "signin" ? handleSignIn : handleSignUp}
              loading={loading}
              disabled={loading}
              marginTop="$2"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </YStack>

          {/* Divider */}
          <XStack alignItems="center" marginVertical="$4" gap="$3">
            <YStack flex={1} height={1} backgroundColor="$borderColor" />
            <Text fontSize={12} color="$foregroundMuted">
              OR CONTINUE WITH
            </Text>
            <YStack flex={1} height={1} backgroundColor="$borderColor" />
          </XStack>

          {/* OAuth buttons */}
          <XStack gap="$3">
            <Button
              flex={1}
              variant="outline"
              onPress={() => handleOAuth("oauth_google")}
            >
              <XStack alignItems="center" gap="$2">
                <Ionicons name="logo-google" size={20} color={theme.color?.val} />
                <Text>Google</Text>
              </XStack>
            </Button>

            <Button
              flex={1}
              variant="outline"
              onPress={() => handleOAuth("oauth_apple")}
            >
              <XStack alignItems="center" gap="$2">
                <Ionicons name="logo-apple" size={20} color={theme.color?.val} />
                <Text>Apple</Text>
              </XStack>
            </Button>
          </XStack>

          {/* Terms */}
          <Text
            fontSize={12}
            color="$foregroundMuted"
            textAlign="center"
            marginTop="$4"
            lineHeight={18}
          >
            By continuing, you agree to our{" "}
            <Text color="$primary">Terms of Service</Text> and{" "}
            <Text color="$primary">Privacy Policy</Text>
          </Text>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
