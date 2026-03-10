import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Modal, Easing } from "react-native";
import { XStack, YStack, Text, useTheme } from "tamagui";
import { Button, GradientCircleIcon } from "@healthymama/ui";

type ExtractionStatus = "idle" | "extracting" | "success" | "error";

interface ExtractionProgressModalProps {
  visible: boolean;
  status: ExtractionStatus;
  progress?: number;
  message?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
  onViewRecipe?: () => void;
}

export function ExtractionProgressModal({
  visible,
  status,
  progress = 0,
  message = "Extracting recipe...",
  errorMessage,
  onRetry,
  onClose,
  onViewRecipe,
}: ExtractionProgressModalProps) {
  const theme = useTheme();

  // Pulse animation for the progress indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  // Pulse animation when extracting
  useEffect(() => {
    if (status === "extracting") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Rotation animation
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      };
    }
  }, [status]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getStatusIcon = () => {
    switch (status) {
      case "extracting":
        return (
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }, { rotate: spin }],
            }}
          >
            <GradientCircleIcon
              size="xl"
              icon={
                <Ionicons name="sparkles" size={32} color="#ffffff" />
              }
            />
          </Animated.View>
        );
      case "success":
        return (
          <YStack
            width={80}
            height={80}
            borderRadius="$10"
            backgroundColor="$success"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="checkmark" size={40} color="#ffffff" />
          </YStack>
        );
      case "error":
        return (
          <YStack
            width={80}
            height={80}
            borderRadius="$10"
            backgroundColor="$error"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="close" size={40} color="#ffffff" />
          </YStack>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "extracting":
        return message;
      case "success":
        return "Recipe extracted successfully!";
      case "error":
        return errorMessage || "Failed to extract recipe";
      default:
        return "";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <YStack
        flex={1}
        backgroundColor="rgba(0, 0, 0, 0.6)"
        alignItems="center"
        justifyContent="center"
        padding="$6"
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: "100%",
            maxWidth: 320,
          }}
        >
          <YStack
            backgroundColor="$background"
            borderRadius="$6"
            padding="$6"
            alignItems="center"
            gap="$5"
          >
            {/* Status icon */}
            <YStack alignItems="center" justifyContent="center" height={100}>
              {getStatusIcon()}
            </YStack>

            {/* Message */}
            <YStack alignItems="center" gap="$2">
              <Text
                fontSize={18}
                fontWeight="700"
                color="$color"
                textAlign="center"
              >
                {status === "extracting" ? "Analyzing Recipe" :
                 status === "success" ? "Success!" : "Oops!"}
              </Text>
              <Text
                fontSize={14}
                color="$foregroundMuted"
                textAlign="center"
                lineHeight={20}
              >
                {getStatusMessage()}
              </Text>
            </YStack>

            {/* Progress bar (only during extraction) */}
            {status === "extracting" && (
              <YStack width="100%" gap="$2">
                <YStack
                  height={6}
                  backgroundColor="$gray200"
                  borderRadius="$10"
                  overflow="hidden"
                >
                  <YStack
                    height="100%"
                    width={`${Math.min(progress, 100)}%`}
                    backgroundColor="$primary"
                    borderRadius="$10"
                  />
                </YStack>
                <Text
                  fontSize={12}
                  color="$foregroundSubtle"
                  textAlign="center"
                >
                  {Math.round(progress)}%
                </Text>
              </YStack>
            )}

            {/* Action buttons */}
            <XStack gap="$3" width="100%">
              {status === "error" && (
                <>
                  <Button
                    variant="ghost"
                    flex={1}
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    flex={1}
                    onPress={onRetry}
                  >
                    Retry
                  </Button>
                </>
              )}
              {status === "success" && (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={onViewRecipe}
                >
                  View Recipe
                </Button>
              )}
            </XStack>
          </YStack>
        </Animated.View>
      </YStack>
    </Modal>
  );
}

// Progress steps component for multi-step extraction
interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

interface ExtractionStepsProps {
  steps: ProgressStep[];
}

export function ExtractionSteps({ steps }: ExtractionStepsProps) {
  const theme = useTheme();

  return (
    <YStack gap="$3" width="100%">
      {steps.map((step, index) => (
        <XStack key={step.id} alignItems="center" gap="$3">
          {/* Step indicator */}
          <YStack
            width={24}
            height={24}
            borderRadius="$10"
            alignItems="center"
            justifyContent="center"
            backgroundColor={
              step.status === "completed"
                ? "$success"
                : step.status === "active"
                ? "$primary"
                : step.status === "error"
                ? "$error"
                : "$gray200"
            }
          >
            {step.status === "completed" ? (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            ) : step.status === "active" ? (
              <Ionicons name="ellipsis-horizontal" size={14} color="#ffffff" />
            ) : step.status === "error" ? (
              <Ionicons name="close" size={14} color="#ffffff" />
            ) : (
              <Text fontSize={12} color="$gray500" fontWeight="600">
                {index + 1}
              </Text>
            )}
          </YStack>

          {/* Step label */}
          <Text
            flex={1}
            fontSize={14}
            color={
              step.status === "completed" || step.status === "active"
                ? "$color"
                : "$foregroundMuted"
            }
            fontWeight={step.status === "active" ? "600" : "400"}
          >
            {step.label}
          </Text>
        </XStack>
      ))}
    </YStack>
  );
}
