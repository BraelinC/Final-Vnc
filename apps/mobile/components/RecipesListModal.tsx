import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, Image, Input, useTheme, ScrollView } from "tamagui";
import { useState, useMemo } from "react";
import { Card, Badge, Button } from "@healthymama/ui";

interface Recipe {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cookTime?: number;
  prepTime?: number;
  servings?: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
}

interface RecipesListModalProps {
  visible: boolean;
  recipes: Recipe[];
  title?: string;
  loading?: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  emptyMessage?: string;
}

export function RecipesListModal({
  visible,
  recipes,
  title = "Recipes",
  loading = false,
  onClose,
  onSelectRecipe,
  emptyMessage = "No recipes found",
}: RecipesListModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter recipes based on search
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [recipes, searchQuery]);

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <RecipeListCard recipe={item} onPress={() => onSelectRecipe(item)} />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
        {/* Header */}
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Text fontSize={20} fontWeight="700" color="$color">
            {title}
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

        {/* Search bar */}
        <YStack paddingHorizontal="$4" paddingVertical="$3">
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
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              backgroundColor="transparent"
              borderWidth={0}
              size="md"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.gray400?.val}
                />
              </Pressable>
            )}
          </XStack>
        </YStack>

        {/* Recipe count */}
        <XStack paddingHorizontal="$4" paddingBottom="$2">
          <Text fontSize={14} color="$foregroundMuted">
            {filteredRecipes.length}{" "}
            {filteredRecipes.length === 1 ? "recipe" : "recipes"}
          </Text>
        </XStack>

        {/* Recipe list */}
        <YStack flex={1} paddingHorizontal="$4">
          {loading ? (
            <YStack gap="$3">
              {[1, 2, 3, 4].map((i) => (
                <RecipeListCardSkeleton key={i} />
              ))}
            </YStack>
          ) : filteredRecipes.length === 0 ? (
            <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
              <Ionicons
                name="restaurant-outline"
                size={64}
                color={theme.gray300?.val}
              />
              <Text fontSize={16} color="$foregroundMuted" textAlign="center">
                {searchQuery ? "No recipes match your search" : emptyMessage}
              </Text>
              {searchQuery && (
                <Button variant="outline" onPress={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </YStack>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap="$3" paddingBottom={insets.bottom + 16}>
                {filteredRecipes.map((recipe) => (
                  <RecipeListCard
                    key={recipe._id}
                    recipe={recipe}
                    onPress={() => onSelectRecipe(recipe)}
                  />
                ))}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      </YStack>
    </Modal>
  );
}

// Individual recipe card
interface RecipeListCardProps {
  recipe: Recipe;
  onPress: () => void;
}

function RecipeListCard({ recipe, onPress }: RecipeListCardProps) {
  const theme = useTheme();
  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const difficultyColors = {
    easy: "$success",
    medium: "$warning",
    hard: "$error",
  };

  return (
    <Card variant="elevated" pressable onPress={onPress}>
      <XStack gap="$3">
        {/* Image */}
        <YStack
          width={80}
          height={80}
          borderRadius="$4"
          overflow="hidden"
          backgroundColor="$gray100"
        >
          {recipe.imageUrl ? (
            <Image
              source={{ uri: recipe.imageUrl }}
              width={80}
              height={80}
              resizeMode="cover"
            />
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Ionicons
                name="restaurant"
                size={32}
                color={theme.gray400?.val}
              />
            </YStack>
          )}
        </YStack>

        {/* Content */}
        <YStack flex={1} gap="$1.5">
          <Text
            fontSize={16}
            fontWeight="600"
            color="$color"
            numberOfLines={2}
          >
            {recipe.title}
          </Text>

          {recipe.description && (
            <Text
              fontSize={13}
              color="$foregroundMuted"
              numberOfLines={1}
            >
              {recipe.description}
            </Text>
          )}

          {/* Meta info */}
          <XStack alignItems="center" gap="$3" marginTop="$1">
            {totalTime > 0 && (
              <XStack alignItems="center" gap="$1">
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={theme.foregroundSubtle?.val}
                />
                <Text fontSize={12} color="$foregroundSubtle">
                  {totalTime} min
                </Text>
              </XStack>
            )}

            {recipe.servings && (
              <XStack alignItems="center" gap="$1">
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={theme.foregroundSubtle?.val}
                />
                <Text fontSize={12} color="$foregroundSubtle">
                  {recipe.servings}
                </Text>
              </XStack>
            )}

            {recipe.difficulty && (
              <Badge
                variant={
                  recipe.difficulty === "easy"
                    ? "successSoft"
                    : recipe.difficulty === "medium"
                    ? "warningSoft"
                    : "errorSoft"
                }
                size="sm"
              >
                {recipe.difficulty}
              </Badge>
            )}
          </XStack>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <XStack flexWrap="wrap" gap="$1" marginTop="$1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="ghost" size="sm">
                  {tag}
                </Badge>
              ))}
            </XStack>
          )}
        </YStack>

        {/* Arrow */}
        <YStack justifyContent="center">
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.gray400?.val}
          />
        </YStack>
      </XStack>
    </Card>
  );
}

// Skeleton loader
function RecipeListCardSkeleton() {
  return (
    <Card variant="flat">
      <XStack gap="$3">
        <YStack
          width={80}
          height={80}
          borderRadius="$4"
          backgroundColor="$gray200"
        />
        <YStack flex={1} gap="$2">
          <YStack
            width="80%"
            height={18}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
          <YStack
            width="100%"
            height={14}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
          <XStack gap="$3">
            <YStack
              width={60}
              height={14}
              borderRadius="$2"
              backgroundColor="$gray200"
            />
            <YStack
              width={40}
              height={14}
              borderRadius="$2"
              backgroundColor="$gray200"
            />
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}
