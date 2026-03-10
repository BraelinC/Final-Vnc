import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "@tamagui/linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, Image, Avatar } from "tamagui";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  userName?: string;
  rightElement?: React.ReactNode;
  onAvatarPress?: () => void;
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  showAvatar = false,
  avatarUrl,
  userName,
  rightElement,
  onAvatarPress,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#dc2626", "#ec4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      paddingTop={insets.top}
    >
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Left section */}
        <XStack alignItems="center" gap="$3" flex={1}>
          {showBackButton && (
            <YStack
              pressStyle={{ opacity: 0.7, scale: 0.95 }}
              onPress={() => router.back()}
              padding="$2"
              marginLeft={-8}
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </YStack>
          )}

          {showAvatar && (
            <YStack
              pressStyle={{ opacity: 0.7, scale: 0.95 }}
              onPress={onAvatarPress}
            >
              <Avatar circular size="$4">
                {avatarUrl ? (
                  <Avatar.Image src={avatarUrl} />
                ) : (
                  <Avatar.Fallback backgroundColor="$white">
                    <Text color="$primary" fontWeight="700" fontSize={16}>
                      {userName?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
            </YStack>
          )}

          <YStack flex={1}>
            {title && (
              <Text
                color="$white"
                fontSize={20}
                fontWeight="700"
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                color="rgba(255, 255, 255, 0.8)"
                fontSize={14}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </YStack>
        </XStack>

        {/* Right section */}
        {rightElement && <XStack marginLeft="$3">{rightElement}</XStack>}
      </XStack>
    </LinearGradient>
  );
}
