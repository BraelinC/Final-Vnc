import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, ScrollView, useTheme } from "tamagui";
import { Button, Card, Badge } from "@healthymama/ui";
import { Header } from "../../components/Header";
import { CookbookCard, CookbookCardSkeleton } from "../../components/CookbookCard";
import { FABGroup } from "../../components/CookingAssistantFAB";

// Mock data
const mockCookbooks = [
  {
    _id: "1",
    name: "Quick Weeknight Dinners",
    description: "Easy recipes for busy weeknights",
    imageUrls: [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
    ],
    recipeCount: 24,
    isPublic: true,
  },
  {
    _id: "2",
    name: "Healthy Breakfast Ideas",
    description: "Start your day right with these nutritious recipes",
    imageUrls: ["https://example.com/4.jpg", "https://example.com/5.jpg"],
    recipeCount: 15,
    isPublic: false,
  },
  {
    _id: "3",
    name: "Holiday Favorites",
    description: "Family recipes passed down through generations",
    imageUrls: [],
    recipeCount: 8,
    isPublic: false,
  },
];

export default function CookbooksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // FAB actions
  const fabActions = [
    {
      id: "create",
      icon: "add" as const,
      label: "New Cookbook",
      onPress: () => router.push("/cookbook/new"),
    },
    {
      id: "import",
      icon: "cloud-download" as const,
      label: "Import",
      onPress: () => {},
      color: theme.secondary?.val,
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <Header title="My Cookbooks" subtitle={`${mockCookbooks.length} cookbooks`} />

      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary?.val}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
      >
        {/* Stats */}
        <XStack gap="$3" marginBottom="$4">
          <Card flex={1} variant="flat">
            <YStack alignItems="center">
              <Text fontSize={28} fontWeight="700" color="$primary">
                {mockCookbooks.reduce((sum, c) => sum + c.recipeCount, 0)}
              </Text>
              <Text fontSize={12} color="$foregroundMuted">
                Total Recipes
              </Text>
            </YStack>
          </Card>
          <Card flex={1} variant="flat">
            <YStack alignItems="center">
              <Text fontSize={28} fontWeight="700" color="$secondary">
                {mockCookbooks.length}
              </Text>
              <Text fontSize={12} color="$foregroundMuted">
                Cookbooks
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Cookbook grid */}
        {loading ? (
          <YStack gap="$4">
            <CookbookCardSkeleton />
            <CookbookCardSkeleton />
          </YStack>
        ) : mockCookbooks.length === 0 ? (
          <Card variant="flat">
            <YStack alignItems="center" paddingVertical="$8" gap="$3">
              <Ionicons name="book-outline" size={64} color={theme.gray300?.val} />
              <Text fontSize={18} fontWeight="600" color="$color">
                No Cookbooks Yet
              </Text>
              <Text fontSize={14} color="$foregroundMuted" textAlign="center">
                Create your first cookbook to start organizing your recipes
              </Text>
              <Button variant="primary" onPress={() => router.push("/cookbook/new")}>
                Create Cookbook
              </Button>
            </YStack>
          </Card>
        ) : (
          <YStack gap="$4">
            {mockCookbooks.map((cookbook) => (
              <CookbookCard
                key={cookbook._id}
                cookbook={cookbook}
                onPress={() => router.push(`/cookbook/${cookbook._id}`)}
              />
            ))}
          </YStack>
        )}
      </ScrollView>

      {/* FAB */}
      <FABGroup actions={fabActions} open={fabOpen} onToggle={setFabOpen} />
    </YStack>
  );
}
