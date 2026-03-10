import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "@tamagui/linear-gradient";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, useTheme } from "tamagui";
import { shadows } from "@healthymama/ui";

type AssistantState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "cooking"
  | "paused";

interface CookingAssistantFABProps {
  state?: AssistantState;
  expanded?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  currentStep?: number;
  totalSteps?: number;
  timerActive?: boolean;
  timerSeconds?: number;
}

export function CookingAssistantFAB({
  state = "idle",
  expanded = false,
  onPress,
  onLongPress,
  currentStep,
  totalSteps,
  timerActive = false,
  timerSeconds = 0,
}: CookingAssistantFABProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for active states
  useEffect(() => {
    if (state === "listening" || state === "thinking") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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

      return () => {
        pulse.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [state]);

  // Glow animation for listening state
  useEffect(() => {
    if (state === "listening") {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();

      return () => {
        glow.stop();
        glowAnim.setValue(0);
      };
    }
  }, [state]);

  // Rotation animation for thinking state
  useEffect(() => {
    if (state === "thinking") {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotate.start();

      return () => {
        rotate.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [state]);

  // Expand animation
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  // Press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress?.();
  };

  // Get state-based colors and icon
  const getStateConfig = () => {
    switch (state) {
      case "listening":
        return {
          colors: ["#ec4899", "#f472b6"] as [string, string],
          icon: "mic" as const,
          label: "Listening...",
        };
      case "thinking":
        return {
          colors: ["#8b5cf6", "#a78bfa"] as [string, string],
          icon: "sparkles" as const,
          label: "Thinking...",
        };
      case "speaking":
        return {
          colors: ["#14b8a6", "#2dd4bf"] as [string, string],
          icon: "volume-high" as const,
          label: "Speaking",
        };
      case "cooking":
        return {
          colors: ["#f59e0b", "#fbbf24"] as [string, string],
          icon: "flame" as const,
          label: currentStep && totalSteps
            ? `Step ${currentStep}/${totalSteps}`
            : "Cooking Mode",
        };
      case "paused":
        return {
          colors: ["#6b7280", "#9ca3af"] as [string, string],
          icon: "pause" as const,
          label: "Paused",
        };
      default:
        return {
          colors: ["#dc2626", "#ec4899"] as [string, string],
          icon: "restaurant" as const,
          label: "Assistant",
        };
    }
  };

  const config = getStateConfig();

  // Interpolate values
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const expandedWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [64, 180],
  });

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 80,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow effect */}
      {state === "listening" && (
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              backgroundColor: config.colors[0],
            },
          ]}
        />
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <Animated.View
          style={[
            styles.fabContainer,
            {
              width: expandedWidth,
              ...shadows.fab,
            },
          ]}
        >
          <LinearGradient
            colors={config.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <XStack alignItems="center" justifyContent="center" gap="$2" flex={1}>
              {/* Icon */}
              <Animated.View
                style={
                  state === "thinking"
                    ? { transform: [{ scale: pulseAnim }, { rotate: spin }] }
                    : { transform: [{ scale: pulseAnim }] }
                }
              >
                <Ionicons name={config.icon} size={28} color="#ffffff" />
              </Animated.View>

              {/* Expanded content */}
              {expanded && (
                <YStack>
                  <Text
                    fontSize={14}
                    fontWeight="700"
                    color="$white"
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                  {timerActive && (
                    <Text fontSize={12} color="rgba(255,255,255,0.8)">
                      {formatTime(timerSeconds)}
                    </Text>
                  )}
                </YStack>
              )}
            </XStack>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Timer badge */}
      {timerActive && !expanded && (
        <YStack
          position="absolute"
          top={-8}
          right={-8}
          backgroundColor="$warning"
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$10"
          minWidth={40}
          alignItems="center"
        >
          <Text fontSize={11} fontWeight="700" color="$black">
            {formatTime(timerSeconds)}
          </Text>
        </YStack>
      )}

      {/* Step indicator */}
      {state === "cooking" && currentStep && totalSteps && !expanded && (
        <YStack
          position="absolute"
          top={-8}
          left={-8}
          backgroundColor="$white"
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$10"
          {...shadows.sm}
        >
          <Text fontSize={11} fontWeight="700" color="$primary">
            {currentStep}/{totalSteps}
          </Text>
        </YStack>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 1000,
  },
  fabContainer: {
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  glow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -8,
    left: -8,
  },
});

// Mini FAB variant for secondary actions
interface MiniFABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
}

export function MiniFAB({
  icon,
  onPress,
  color = "#ffffff",
  backgroundColor = "#ec4899",
}: MiniFABProps) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <YStack
          width={48}
          height={48}
          borderRadius="$10"
          backgroundColor={backgroundColor}
          alignItems="center"
          justifyContent="center"
          {...shadows.md}
        >
          <Ionicons name={icon} size={24} color={color} />
        </YStack>
      </Pressable>
    </Animated.View>
  );
}

// FAB Group for multiple actions
interface FABAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABGroupProps {
  actions: FABAction[];
  mainIcon?: keyof typeof Ionicons.glyphMap;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export function FABGroup({
  actions,
  mainIcon = "add",
  open = false,
  onToggle,
}: FABGroupProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(actions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Rotate main FAB icon
    Animated.spring(rotateAnim, {
      toValue: open ? 1 : 0,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Stagger action buttons
    actions.forEach((_, index) => {
      Animated.spring(actionsAnim[index], {
        toValue: open ? 1 : 0,
        friction: 8,
        delay: open ? index * 50 : (actions.length - 1 - index) * 50,
        useNativeDriver: true,
      }).start();
    });
  }, [open]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const handleMainPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle?.(!open);
  };

  const handleActionPress = (action: FABAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action.onPress();
    onToggle?.(false);
  };

  return (
    <YStack
      position="absolute"
      right={16}
      bottom={insets.bottom + 80}
      alignItems="flex-end"
      gap="$3"
    >
      {/* Action buttons */}
      {actions.map((action, index) => {
        const translateY = actionsAnim[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        });

        return (
          <Animated.View
            key={action.id}
            style={{
              opacity: actionsAnim[index],
              transform: [{ translateY }],
            }}
          >
            <XStack alignItems="center" gap="$2">
              <YStack
                backgroundColor="$background"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
                {...shadows.sm}
              >
                <Text fontSize={14} fontWeight="500" color="$color">
                  {action.label}
                </Text>
              </YStack>
              <MiniFAB
                icon={action.icon}
                onPress={() => handleActionPress(action)}
                backgroundColor={action.color || theme.primary?.val}
              />
            </XStack>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <Pressable onPress={handleMainPress}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <LinearGradient
            colors={["#dc2626", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            width={64}
            height={64}
            borderRadius={32}
            alignItems="center"
            justifyContent="center"
            {...shadows.fab}
          >
            <Ionicons name={mainIcon} size={28} color="#ffffff" />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </YStack>
  );
}
