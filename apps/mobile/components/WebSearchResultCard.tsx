import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { XStack, YStack, Text, Image, useTheme } from "tamagui";
import { Card, Badge } from "@healthymama/ui";

interface WebSearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  favicon?: string;
}

interface WebSearchResultCardProps {
  result: WebSearchResult;
  index: number;
  onPress?: (result: WebSearchResult) => void;
}

export function WebSearchResultCard({
  result,
  index,
  onPress,
}: WebSearchResultCardProps) {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Staggered fade-in animation
  useEffect(() => {
    const delay = index * 100;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    onPress?.(result);
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <Card
        variant="elevated"
        pressable
        onPress={handlePress}
        marginBottom="$3"
      >
        <XStack gap="$3">
          {/* Image thumbnail */}
          {result.imageUrl && (
            <YStack
              width={80}
              height={80}
              borderRadius="$4"
              overflow="hidden"
              backgroundColor="$gray100"
            >
              <Image
                source={{ uri: result.imageUrl }}
                width={80}
                height={80}
                resizeMode="cover"
              />
            </YStack>
          )}

          {/* Content */}
          <YStack flex={1} gap="$1.5">
            {/* Source badge */}
            <XStack alignItems="center" gap="$2">
              {result.favicon && (
                <Image
                  source={{ uri: result.favicon }}
                  width={16}
                  height={16}
                  borderRadius="$1"
                />
              )}
              <Badge variant="ghost" size="sm">
                {result.source}
              </Badge>
            </XStack>

            {/* Title */}
            <Text
              fontSize={16}
              fontWeight="600"
              color="$color"
              numberOfLines={2}
            >
              {result.title}
            </Text>

            {/* Description */}
            <Text
              fontSize={14}
              color="$foregroundMuted"
              numberOfLines={2}
              lineHeight={20}
            >
              {result.description}
            </Text>

            {/* URL */}
            <XStack alignItems="center" gap="$1.5" marginTop="$1">
              <Ionicons
                name="link-outline"
                size={14}
                color={theme.foregroundSubtle?.val}
              />
              <Text
                fontSize={12}
                color="$foregroundSubtle"
                numberOfLines={1}
                flex={1}
              >
                {result.url.replace(/^https?:\/\//, "").split("/")[0]}
              </Text>
            </XStack>
          </YStack>

          {/* Arrow icon */}
          <YStack justifyContent="center">
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.gray400?.val}
            />
          </YStack>
        </XStack>
      </Card>
    </Animated.View>
  );
}

// Loading skeleton
export function WebSearchResultSkeleton() {
  return (
    <Card variant="flat" marginBottom="$3">
      <XStack gap="$3">
        <YStack
          width={80}
          height={80}
          borderRadius="$4"
          backgroundColor="$gray200"
        />
        <YStack flex={1} gap="$2">
          <YStack
            width={60}
            height={16}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
          <YStack
            width="100%"
            height={20}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
          <YStack
            width="80%"
            height={16}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
          <YStack
            width={120}
            height={14}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
        </YStack>
      </XStack>
    </Card>
  );
}
