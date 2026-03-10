import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  XStack,
  YStack,
  Text,
  Input,
  ScrollView,
  Image,
  useTheme,
} from "tamagui";
import { Card, Badge, Button, GradientCircleIcon } from "@healthymama/ui";
import { Header } from "../../components/Header";
import {
  WebSearchResultCard,
  WebSearchResultSkeleton,
} from "../../components/WebSearchResultCard";
import { CookbookCard, CookbookCardSkeleton } from "../../components/CookbookCard";
import { CookingAssistantFAB, FABGroup } from "../../components/CookingAssistantFAB";
import { AddRecipeModal } from "../../components/AddRecipeModal";
import { ExtractionProgressModal } from "../../components/ExtractionProgressModal";

// Mock data - in real app, this comes from Convex
const mockCategories = [
  { id: "1", name: "Quick Meals", icon: "time-outline", count: 24 },
  { id: "2", name: "Healthy", icon: "leaf-outline", count: 156 },
  { id: "3", name: "Desserts", icon: "ice-cream-outline", count: 89 },
  { id: "4", name: "Vegetarian", icon: "nutrition-outline", count: 67 },
  { id: "5", name: "Breakfast", icon: "sunny-outline", count: 45 },
  { id: "6", name: "Dinner", icon: "moon-outline", count: 112 },
];

const mockTrendingRecipes = [
  {
    _id: "1",
    title: "Creamy Tuscan Chicken",
    imageUrl: "https://example.com/chicken.jpg",
    cookTime: 30,
    difficulty: "easy" as const,
  },
  {
    _id: "2",
    title: "Avocado Toast with Poached Eggs",
    imageUrl: "https://example.com/toast.jpg",
    cookTime: 15,
    difficulty: "easy" as const,
  },
  {
    _id: "3",
    title: "Thai Green Curry",
    imageUrl: "https://example.com/curry.jpg",
    cookTime: 45,
    difficulty: "medium" as const,
  },
];

const mockSearchResults = [
  {
    id: "1",
    title: "Classic Chocolate Chip Cookies",
    description:
      "The best homemade chocolate chip cookies - crispy edges, chewy centers, and loaded with chocolate.",
    url: "https://example.com/cookies",
    imageUrl: "https://example.com/cookies.jpg",
    source: "AllRecipes",
  },
  {
    id: "2",
    title: "Easy Banana Bread Recipe",
    description:
      "Moist and delicious banana bread that's perfect for breakfast or snacking.",
    url: "https://example.com/banana-bread",
    imageUrl: "https://example.com/bread.jpg",
    source: "Food Network",
  },
];

export default function DiscoverScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof mockSearchResults>(
    []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [addRecipeModalVisible, setAddRecipeModalVisible] = useState(false);
  const [extractionModalVisible, setExtractionModalVisible] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<
    "idle" | "extracting" | "success" | "error"
  >("idle");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [fabGroupOpen, setFabGroupOpen] = useState(false);

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearching(true);

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSearchResults(mockSearchResults);
    setIsSearching(false);
  }, [searchQuery]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Handle URL extraction
  const handleUrlSubmit = useCallback(async (url: string) => {
    setAddRecipeModalVisible(false);
    setExtractionModalVisible(true);
    setExtractionStatus("extracting");
    setExtractionProgress(0);

    // Simulate extraction progress
    const interval = setInterval(() => {
      setExtractionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    // Simulate extraction completion
    setTimeout(() => {
      clearInterval(interval);
      setExtractionProgress(100);
      setExtractionStatus("success");
    }, 3000);
  }, []);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Show search mode
  const showSearchMode = searchQuery.length > 0 || searchResults.length > 0;

  // FAB actions
  const fabActions = [
    {
      id: "url",
      icon: "link" as const,
      label: "From URL",
      onPress: () => setAddRecipeModalVisible(true),
    },
    {
      id: "scan",
      icon: "camera" as const,
      label: "Scan Recipe",
      onPress: () => setAddRecipeModalVisible(true),
      color: theme.secondary?.val,
    },
    {
      id: "manual",
      icon: "create" as const,
      label: "Create New",
      onPress: () => router.push("/(tabs)/create"),
      color: "#8b5cf6",
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header with gradient */}
      <Header
        title={`${greeting}, ${user?.firstName || "Chef"}!`}
        subtitle="What would you like to cook today?"
        showAvatar
        avatarUrl={user?.imageUrl}
        userName={user?.firstName}
        onAvatarPress={() => router.push("/(tabs)/profile")}
      />

      {/* Search bar */}
      <YStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack
          backgroundColor="$gray100"
          borderRadius="$4"
          paddingHorizontal="$3"
          alignItems="center"
          gap="$2"
        >
          <Ionicons name="search" size={20} color={theme.gray400?.val} />
          <Input
            flex={1}
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            backgroundColor="transparent"
            borderWidth={0}
            size="md"
          />
          {searchQuery.length > 0 && (
            <YStack pressStyle={{ opacity: 0.7 }} onPress={clearSearch}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.gray400?.val}
              />
            </YStack>
          )}
        </XStack>
      </YStack>

      {/* Content */}
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
      >
        {showSearchMode ? (
          // Search results view
          <YStack padding="$4" gap="$4">
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={18} fontWeight="700" color="$color">
                Search Results
              </Text>
              <Button variant="ghost" size="sm" onPress={clearSearch}>
                Clear
              </Button>
            </XStack>

            {isSearching ? (
              <YStack gap="$3">
                {[1, 2, 3].map((i) => (
                  <WebSearchResultSkeleton key={i} />
                ))}
              </YStack>
            ) : searchResults.length === 0 ? (
              <YStack alignItems="center" paddingVertical="$8" gap="$3">
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={theme.gray300?.val}
                />
                <Text fontSize={16} color="$foregroundMuted" textAlign="center">
                  No recipes found for "{searchQuery}"
                </Text>
                <Button variant="outline" onPress={handleSearch}>
                  Try Again
                </Button>
              </YStack>
            ) : (
              <YStack gap="$3">
                {searchResults.map((result, index) => (
                  <WebSearchResultCard
                    key={result.id}
                    result={result}
                    index={index}
                    onPress={() => handleUrlSubmit(result.url)}
                  />
                ))}
              </YStack>
            )}
          </YStack>
        ) : (
          // Discovery view
          <YStack paddingBottom={insets.bottom + 100}>
            {/* Categories */}
            <YStack gap="$3" padding="$4">
              <Text fontSize={18} fontWeight="700" color="$color">
                Categories
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {mockCategories.map((category) => (
                  <Card
                    key={category.id}
                    variant="flat"
                    pressable
                    padding="$3"
                    width="48%"
                    onPress={() =>
                      router.push(`/search?category=${category.name}`)
                    }
                  >
                    <XStack alignItems="center" gap="$2">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$3"
                        backgroundColor="$primarySoft"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={20}
                          color={theme.primary?.val}
                        />
                      </YStack>
                      <YStack flex={1}>
                        <Text
                          fontSize={14}
                          fontWeight="600"
                          color="$color"
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>
                        <Text fontSize={12} color="$foregroundMuted">
                          {category.count} recipes
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                ))}
              </XStack>
            </YStack>

            {/* Trending recipes */}
            <YStack gap="$3" padding="$4">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={18} fontWeight="700" color="$color">
                  Trending Now
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push("/trending")}
                >
                  See All
                </Button>
              </XStack>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$3">
                  {mockTrendingRecipes.map((recipe) => (
                    <Card
                      key={recipe._id}
                      variant="elevated"
                      pressable
                      padding={0}
                      width={200}
                      overflow="hidden"
                      onPress={() => router.push(`/recipe/${recipe._id}`)}
                    >
                      <YStack height={120} backgroundColor="$gray100">
                        {recipe.imageUrl && (
                          <Image
                            source={{ uri: recipe.imageUrl }}
                            width="100%"
                            height="100%"
                            resizeMode="cover"
                          />
                        )}
                      </YStack>
                      <YStack padding="$3" gap="$1.5">
                        <Text
                          fontSize={14}
                          fontWeight="600"
                          color="$color"
                          numberOfLines={2}
                        >
                          {recipe.title}
                        </Text>
                        <XStack alignItems="center" gap="$2">
                          <XStack alignItems="center" gap="$1">
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={theme.foregroundSubtle?.val}
                            />
                            <Text fontSize={12} color="$foregroundSubtle">
                              {recipe.cookTime}m
                            </Text>
                          </XStack>
                          <Badge
                            variant={
                              recipe.difficulty === "easy"
                                ? "successSoft"
                                : "warningSoft"
                            }
                            size="sm"
                          >
                            {recipe.difficulty}
                          </Badge>
                        </XStack>
                      </YStack>
                    </Card>
                  ))}
                </XStack>
              </ScrollView>
            </YStack>

            {/* Quick actions */}
            <YStack gap="$3" padding="$4">
              <Text fontSize={18} fontWeight="700" color="$color">
                Quick Actions
              </Text>

              <XStack gap="$3">
                <Card
                  flex={1}
                  variant="outline"
                  pressable
                  onPress={() => setAddRecipeModalVisible(true)}
                >
                  <YStack alignItems="center" gap="$2">
                    <GradientCircleIcon
                      size="lg"
                      icon={<Ionicons name="add" size={28} color="#ffffff" />}
                    />
                    <Text fontSize={14} fontWeight="600" color="$color">
                      Add Recipe
                    </Text>
                  </YStack>
                </Card>

                <Card
                  flex={1}
                  variant="outline"
                  pressable
                  onPress={() => router.push("/(tabs)/cookbooks")}
                >
                  <YStack alignItems="center" gap="$2">
                    <YStack
                      width={48}
                      height={48}
                      borderRadius="$10"
                      backgroundColor="$secondary"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name="book" size={24} color="#ffffff" />
                    </YStack>
                    <Text fontSize={14} fontWeight="600" color="$color">
                      My Cookbooks
                    </Text>
                  </YStack>
                </Card>
              </XStack>
            </YStack>

            {/* AI suggestion card */}
            <YStack padding="$4">
              <Card variant="elevated" pressable>
                <XStack gap="$3" alignItems="center">
                  <GradientCircleIcon
                    size="lg"
                    colors={["#8b5cf6", "#ec4899"]}
                    icon={<Ionicons name="sparkles" size={24} color="#ffffff" />}
                  />
                  <YStack flex={1}>
                    <Text fontSize={16} fontWeight="600" color="$color">
                      Get Recipe Suggestions
                    </Text>
                    <Text fontSize={14} color="$foregroundMuted">
                      Tell us what you have, we'll suggest what to make
                    </Text>
                  </YStack>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.gray400?.val}
                  />
                </XStack>
              </Card>
            </YStack>
          </YStack>
        )}
      </ScrollView>

      {/* FAB Group */}
      <FABGroup
        actions={fabActions}
        open={fabGroupOpen}
        onToggle={setFabGroupOpen}
      />

      {/* Add Recipe Modal */}
      <AddRecipeModal
        visible={addRecipeModalVisible}
        onClose={() => setAddRecipeModalVisible(false)}
        onSubmitUrl={handleUrlSubmit}
        onScanImage={() => {
          setAddRecipeModalVisible(false);
          // Navigate to camera
        }}
        onManualEntry={() => {
          setAddRecipeModalVisible(false);
          router.push("/(tabs)/create");
        }}
      />

      {/* Extraction Progress Modal */}
      <ExtractionProgressModal
        visible={extractionModalVisible}
        status={extractionStatus}
        progress={extractionProgress}
        onClose={() => {
          setExtractionModalVisible(false);
          setExtractionStatus("idle");
        }}
        onRetry={() => {
          setExtractionStatus("extracting");
          setExtractionProgress(0);
        }}
        onViewRecipe={() => {
          setExtractionModalVisible(false);
          router.push("/recipe/new");
        }}
      />
    </YStack>
  );
}
