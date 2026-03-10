import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, Input, ScrollView, Image, useTheme } from "tamagui";
import { Button, Card, Badge, GradientCircleIcon } from "@healthymama/ui";

type AddMode = "url" | "scan" | "manual";

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitUrl: (url: string) => void;
  onScanImage: () => void;
  onManualEntry: () => void;
  extracting?: boolean;
}

export function AddRecipeModal({
  visible,
  onClose,
  onSubmitUrl,
  onScanImage,
  onManualEntry,
  extracting = false,
}: AddRecipeModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AddMode>("url");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // Keyboard height animation
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      setUrl("");
      setUrlError("");
      setMode("url");
    }
  }, [visible]);

  // Keyboard handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: Platform.OS === "ios" ? 250 : 0,
          useNativeDriver: false,
        }).start();
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: Platform.OS === "ios" ? 250 : 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // URL validation
  const validateUrl = (input: string): boolean => {
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlPattern.test(input);
  };

  // Handle URL submission
  const handleSubmitUrl = () => {
    if (!url.trim()) {
      setUrlError("Please enter a URL");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateUrl(url.trim())) {
      setUrlError("Please enter a valid URL");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setUrlError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Add https:// if not present
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    onSubmitUrl(finalUrl);
  };

  // Handle mode selection
  const handleModeChange = (newMode: AddMode) => {
    Haptics.selectionAsync();
    setMode(newMode);
    setUrlError("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
          }}
        >
          <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
            {/* Header */}
            <XStack
              paddingHorizontal="$4"
              paddingVertical="$3"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text fontSize={24} fontWeight="700" color="$color">
                Add Recipe
              </Text>
              <Pressable onPress={onClose}>
                <YStack
                  width={36}
                  height={36}
                  borderRadius="$10"
                  backgroundColor="$gray100"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons name="close" size={20} color={theme.gray600?.val} />
                </YStack>
              </Pressable>
            </XStack>

            {/* Mode selector */}
            <XStack
              marginHorizontal="$4"
              marginVertical="$3"
              backgroundColor="$gray100"
              borderRadius="$4"
              padding="$1"
            >
              {(["url", "scan", "manual"] as AddMode[]).map((m) => (
                <YStack
                  key={m}
                  flex={1}
                  paddingVertical="$2"
                  borderRadius="$3"
                  alignItems="center"
                  backgroundColor={mode === m ? "$background" : "transparent"}
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => handleModeChange(m)}
                >
                  <Text
                    fontSize={14}
                    fontWeight={mode === m ? "600" : "400"}
                    color={mode === m ? "$primary" : "$foregroundMuted"}
                  >
                    {m === "url" ? "From URL" : m === "scan" ? "Scan" : "Manual"}
                  </Text>
                </YStack>
              ))}
            </XStack>

            {/* Content based on mode */}
            <ScrollView
              flex={1}
              paddingHorizontal="$4"
              keyboardShouldPersistTaps="handled"
            >
              {mode === "url" && (
                <UrlInputSection
                  url={url}
                  setUrl={setUrl}
                  error={urlError}
                  onSubmit={handleSubmitUrl}
                  loading={extracting}
                />
              )}

              {mode === "scan" && (
                <ScanSection onScan={onScanImage} />
              )}

              {mode === "manual" && (
                <ManualEntrySection onStart={onManualEntry} />
              )}
            </ScrollView>

            {/* Keyboard spacer */}
            <Animated.View style={{ height: keyboardHeight }} />
          </YStack>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// URL Input Section
interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  error: string;
  onSubmit: () => void;
  loading: boolean;
}

function UrlInputSection({
  url,
  setUrl,
  error,
  onSubmit,
  loading,
}: UrlInputSectionProps) {
  const theme = useTheme();

  return (
    <YStack gap="$4">
      {/* Hero section */}
      <YStack alignItems="center" paddingVertical="$4" gap="$3">
        <GradientCircleIcon
          size="xl"
          icon={<Ionicons name="link" size={32} color="#ffffff" />}
        />
        <YStack alignItems="center" gap="$1">
          <Text fontSize={18} fontWeight="600" color="$color">
            Import from URL
          </Text>
          <Text
            fontSize={14}
            color="$foregroundMuted"
            textAlign="center"
            lineHeight={20}
          >
            Paste a recipe URL and we'll extract all the details automatically
          </Text>
        </YStack>
      </YStack>

      {/* URL input */}
      <YStack gap="$2">
        <XStack
          backgroundColor="$gray50"
          borderRadius="$4"
          borderWidth={2}
          borderColor={error ? "$error" : "$borderColor"}
          alignItems="center"
          paddingHorizontal="$3"
        >
          <Ionicons name="globe-outline" size={20} color={theme.gray400?.val} />
          <Input
            flex={1}
            placeholder="https://example.com/recipe"
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              if (error) {
                // Clear error when typing
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            backgroundColor="transparent"
            borderWidth={0}
            size="lg"
          />
          {url.length > 0 && (
            <Pressable onPress={() => setUrl("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.gray400?.val}
              />
            </Pressable>
          )}
        </XStack>
        {error && (
          <Text fontSize={13} color="$error">
            {error}
          </Text>
        )}
      </YStack>

      {/* Submit button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={onSubmit}
        loading={loading}
        disabled={loading}
      >
        Extract Recipe
      </Button>

      {/* Supported sites */}
      <YStack gap="$2" marginTop="$2">
        <Text fontSize={12} color="$foregroundMuted" textAlign="center">
          Works with most recipe websites including:
        </Text>
        <XStack flexWrap="wrap" justifyContent="center" gap="$2">
          {["AllRecipes", "Food Network", "Tasty", "NYT Cooking", "BBC"].map(
            (site) => (
              <Badge key={site} variant="ghost" size="sm">
                {site}
              </Badge>
            )
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}

// Scan Section
interface ScanSectionProps {
  onScan: () => void;
}

function ScanSection({ onScan }: ScanSectionProps) {
  return (
    <YStack gap="$4">
      {/* Hero section */}
      <YStack alignItems="center" paddingVertical="$4" gap="$3">
        <GradientCircleIcon
          size="xl"
          icon={<Ionicons name="camera" size={32} color="#ffffff" />}
        />
        <YStack alignItems="center" gap="$1">
          <Text fontSize={18} fontWeight="600" color="$color">
            Scan Recipe
          </Text>
          <Text
            fontSize={14}
            color="$foregroundMuted"
            textAlign="center"
            lineHeight={20}
          >
            Take a photo of a recipe from a cookbook, magazine, or handwritten
            notes
          </Text>
        </YStack>
      </YStack>

      {/* Scan options */}
      <YStack gap="$3">
        <Card variant="outline" pressable onPress={onScan}>
          <XStack alignItems="center" gap="$3">
            <YStack
              width={48}
              height={48}
              borderRadius="$3"
              backgroundColor="$primarySoft"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="camera" size={24} color="#ec4899" />
            </YStack>
            <YStack flex={1}>
              <Text fontSize={16} fontWeight="600" color="$color">
                Take Photo
              </Text>
              <Text fontSize={14} color="$foregroundMuted">
                Use your camera to capture a recipe
              </Text>
            </YStack>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </XStack>
        </Card>

        <Card variant="outline" pressable onPress={onScan}>
          <XStack alignItems="center" gap="$3">
            <YStack
              width={48}
              height={48}
              borderRadius="$3"
              backgroundColor="$secondarySoft"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="images" size={24} color="#14b8a6" />
            </YStack>
            <YStack flex={1}>
              <Text fontSize={16} fontWeight="600" color="$color">
                Choose from Library
              </Text>
              <Text fontSize={14} color="$foregroundMuted">
                Select an existing photo
              </Text>
            </YStack>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </XStack>
        </Card>
      </YStack>

      {/* Tips */}
      <Card variant="flat" marginTop="$2">
        <XStack gap="$2">
          <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="600" color="$color">
              Tips for best results
            </Text>
            <Text fontSize={13} color="$foregroundMuted" lineHeight={18}>
              • Ensure good lighting and focus{"\n"}
              • Include the full recipe in frame{"\n"}
              • Avoid glare and shadows
            </Text>
          </YStack>
        </XStack>
      </Card>
    </YStack>
  );
}

// Manual Entry Section
interface ManualEntrySectionProps {
  onStart: () => void;
}

function ManualEntrySection({ onStart }: ManualEntrySectionProps) {
  return (
    <YStack gap="$4">
      {/* Hero section */}
      <YStack alignItems="center" paddingVertical="$4" gap="$3">
        <GradientCircleIcon
          size="xl"
          icon={<Ionicons name="create" size={32} color="#ffffff" />}
        />
        <YStack alignItems="center" gap="$1">
          <Text fontSize={18} fontWeight="600" color="$color">
            Create from Scratch
          </Text>
          <Text
            fontSize={14}
            color="$foregroundMuted"
            textAlign="center"
            lineHeight={20}
          >
            Manually enter your own recipe with ingredients, instructions, and
            photos
          </Text>
        </YStack>
      </YStack>

      {/* What you can add */}
      <YStack gap="$3">
        {[
          { icon: "restaurant", label: "Recipe title and description" },
          { icon: "list", label: "Ingredients with quantities" },
          { icon: "checkbox", label: "Step-by-step instructions" },
          { icon: "image", label: "Photos for each step" },
          { icon: "time", label: "Prep and cook times" },
          { icon: "nutrition", label: "Nutritional information" },
        ].map((item) => (
          <XStack key={item.label} alignItems="center" gap="$3">
            <YStack
              width={32}
              height={32}
              borderRadius="$10"
              backgroundColor="$gray100"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color="#6b7280"
              />
            </YStack>
            <Text fontSize={15} color="$color">
              {item.label}
            </Text>
          </XStack>
        ))}
      </YStack>

      {/* Start button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={onStart}
        marginTop="$2"
      >
        Start Creating
      </Button>
    </YStack>
  );
}
