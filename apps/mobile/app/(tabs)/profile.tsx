import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, ScrollView, Avatar, useTheme } from "tamagui";
import { Button, Card, Badge, GradientCircleIcon } from "@healthymama/ui";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();

  const menuItems = [
    {
      id: "account",
      icon: "person-outline" as const,
      label: "Account Settings",
      onPress: () => {},
    },
    {
      id: "notifications",
      icon: "notifications-outline" as const,
      label: "Notifications",
      onPress: () => {},
    },
    {
      id: "preferences",
      icon: "options-outline" as const,
      label: "Preferences",
      onPress: () => {},
    },
    {
      id: "privacy",
      icon: "shield-outline" as const,
      label: "Privacy",
      onPress: () => {},
    },
    {
      id: "help",
      icon: "help-circle-outline" as const,
      label: "Help & Support",
      onPress: () => {},
    },
    {
      id: "about",
      icon: "information-circle-outline" as const,
      label: "About",
      onPress: () => {},
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {/* Profile header */}
        <Card variant="elevated" marginBottom="$4">
          <YStack alignItems="center" gap="$3">
            <Avatar circular size="$12">
              {user?.imageUrl ? (
                <Avatar.Image src={user.imageUrl} />
              ) : (
                <Avatar.Fallback backgroundColor="$primary">
                  <Text color="$white" fontSize={32} fontWeight="700">
                    {user?.firstName?.charAt(0) || "U"}
                  </Text>
                </Avatar.Fallback>
              )}
            </Avatar>

            <YStack alignItems="center" gap="$1">
              <Text fontSize={24} fontWeight="700" color="$color">
                {user?.fullName || "User"}
              </Text>
              <Text fontSize={14} color="$foregroundMuted">
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </YStack>

            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </YStack>
        </Card>

        {/* Stats */}
        <XStack gap="$3" marginBottom="$4">
          <Card flex={1} variant="flat">
            <YStack alignItems="center">
              <Text fontSize={24} fontWeight="700" color="$primary">
                47
              </Text>
              <Text fontSize={12} color="$foregroundMuted">
                Recipes
              </Text>
            </YStack>
          </Card>
          <Card flex={1} variant="flat">
            <YStack alignItems="center">
              <Text fontSize={24} fontWeight="700" color="$secondary">
                5
              </Text>
              <Text fontSize={12} color="$foregroundMuted">
                Cookbooks
              </Text>
            </YStack>
          </Card>
          <Card flex={1} variant="flat">
            <YStack alignItems="center">
              <Text fontSize={24} fontWeight="700" color="$warning">
                12
              </Text>
              <Text fontSize={12} color="$foregroundMuted">
                Cooked
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Premium card */}
        <Card variant="elevated" marginBottom="$4" padding={0} overflow="hidden">
          <YStack
            backgroundColor="$primary"
            padding="$4"
            gap="$2"
          >
            <XStack alignItems="center" gap="$2">
              <GradientCircleIcon
                size="md"
                colors={["#ffffff", "#fce7f3"]}
                icon={<Ionicons name="sparkles" size={20} color="#ec4899" />}
              />
              <Text fontSize={18} fontWeight="700" color="$white">
                HealthyMama Pro
              </Text>
            </XStack>
            <Text fontSize={14} color="rgba(255,255,255,0.8)">
              Unlock AI meal planning, unlimited recipes, and more
            </Text>
            <Button
              variant="ghost"
              backgroundColor="$white"
              color="$primary"
              marginTop="$2"
            >
              Upgrade Now
            </Button>
          </YStack>
        </Card>

        {/* Menu items */}
        <Card variant="elevated" marginBottom="$4">
          {menuItems.map((item, index) => (
            <YStack key={item.id}>
              <XStack
                alignItems="center"
                gap="$3"
                paddingVertical="$3"
                pressStyle={{ opacity: 0.7 }}
                onPress={item.onPress}
              >
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$gray100"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={theme.foregroundMuted?.val}
                  />
                </YStack>
                <Text flex={1} fontSize={16} color="$color">
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.gray400?.val}
                />
              </XStack>
              {index < menuItems.length - 1 && (
                <YStack
                  height={1}
                  backgroundColor="$borderColor"
                  marginLeft={52}
                />
              )}
            </YStack>
          ))}
        </Card>

        {/* Sign out button */}
        <Button
          variant="ghost"
          fullWidth
          onPress={() => signOut()}
        >
          <XStack alignItems="center" gap="$2">
            <Ionicons name="log-out-outline" size={20} color={theme.error?.val} />
            <Text color="$error" fontWeight="600">
              Sign Out
            </Text>
          </XStack>
        </Button>

        {/* Version */}
        <Text
          fontSize={12}
          color="$foregroundSubtle"
          textAlign="center"
          marginTop="$4"
        >
          Version 1.0.0
        </Text>
      </ScrollView>
    </YStack>
  );
}
