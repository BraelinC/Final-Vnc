import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { XStack, YStack, Text, Image, useTheme } from "tamagui";
import { Card, Badge } from "@healthymama/ui";

interface CookbookImage {
  url: string;
}

interface Cookbook {
  _id: string;
  name: string;
  description?: string;
  imageUrls?: string[];
  recipeCount: number;
  isPublic: boolean;
}

interface CookbookCardProps {
  cookbook: Cookbook;
  onPress?: (cookbook: Cookbook) => void;
}

export function CookbookCard({ cookbook, onPress }: CookbookCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(cookbook);
    } else {
      router.push(`/cookbook/${cookbook._id}`);
    }
  };

  // Get up to 4 images for the grid
  const images = cookbook.imageUrls?.slice(0, 4) || [];
  const hasImages = images.length > 0;

  return (
    <Card
      variant="elevated"
      pressable
      onPress={handlePress}
      padding={0}
      overflow="hidden"
    >
      {/* Image grid */}
      <YStack height={160} backgroundColor="$gray100">
        {hasImages ? (
          <ImageGrid images={images} />
        ) : (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$gray100"
          >
            <Ionicons name="book-outline" size={48} color={theme.gray400?.val} />
          </YStack>
        )}
      </YStack>

      {/* Content */}
      <YStack padding="$3" gap="$2">
        {/* Title row */}
        <XStack alignItems="center" justifyContent="space-between" gap="$2">
          <Text
            fontSize={18}
            fontWeight="700"
            color="$color"
            flex={1}
            numberOfLines={1}
          >
            {cookbook.name}
          </Text>
          {!cookbook.isPublic && (
            <Ionicons name="lock-closed" size={16} color={theme.gray400?.val} />
          )}
        </XStack>

        {/* Description */}
        {cookbook.description && (
          <Text
            fontSize={14}
            color="$foregroundMuted"
            numberOfLines={2}
            lineHeight={20}
          >
            {cookbook.description}
          </Text>
        )}

        {/* Footer */}
        <XStack alignItems="center" justifyContent="space-between" marginTop="$1">
          <Badge variant="primarySoft" size="sm">
            <Ionicons
              name="restaurant-outline"
              size={12}
              color={theme.primary?.val}
            />
            <Text fontSize={12} color="$primary" fontWeight="600">
              {cookbook.recipeCount} {cookbook.recipeCount === 1 ? "recipe" : "recipes"}
            </Text>
          </Badge>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.gray400?.val}
          />
        </XStack>
      </YStack>
    </Card>
  );
}

// 2x2 image grid component
function ImageGrid({ images }: { images: string[] }) {
  const gridImages = [...images];
  while (gridImages.length < 4) {
    gridImages.push("");
  }

  return (
    <XStack flex={1} flexWrap="wrap">
      {gridImages.map((url, index) => (
        <YStack
          key={index}
          width="50%"
          height="50%"
          borderWidth={0.5}
          borderColor="$white"
        >
          {url ? (
            <Image
              source={{ uri: url }}
              width="100%"
              height="100%"
              resizeMode="cover"
            />
          ) : (
            <YStack flex={1} backgroundColor="$gray100" />
          )}
        </YStack>
      ))}
    </XStack>
  );
}

// Skeleton loader
export function CookbookCardSkeleton() {
  return (
    <Card variant="flat" padding={0} overflow="hidden">
      <YStack height={160} backgroundColor="$gray200" />
      <YStack padding="$3" gap="$2">
        <YStack
          width="70%"
          height={20}
          borderRadius="$2"
          backgroundColor="$gray200"
        />
        <YStack
          width="100%"
          height={16}
          borderRadius="$2"
          backgroundColor="$gray200"
        />
        <YStack
          width={80}
          height={24}
          borderRadius="$10"
          backgroundColor="$gray200"
        />
      </YStack>
    </Card>
  );
}

// Compact variant for list views
interface CookbookCardCompactProps {
  cookbook: Cookbook;
  selected?: boolean;
  onPress?: (cookbook: Cookbook) => void;
}

export function CookbookCardCompact({
  cookbook,
  selected = false,
  onPress,
}: CookbookCardCompactProps) {
  const theme = useTheme();

  const handlePress = () => {
    onPress?.(cookbook);
  };

  const firstImage = cookbook.imageUrls?.[0];

  return (
    <Card
      variant={selected ? "outline" : "flat"}
      pressable
      onPress={handlePress}
      borderColor={selected ? "$primary" : "$borderColor"}
      borderWidth={selected ? 2 : 1}
    >
      <XStack alignItems="center" gap="$3">
        {/* Thumbnail */}
        <YStack
          width={56}
          height={56}
          borderRadius="$3"
          overflow="hidden"
          backgroundColor="$gray100"
        >
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              width={56}
              height={56}
              resizeMode="cover"
            />
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Ionicons name="book-outline" size={24} color={theme.gray400?.val} />
            </YStack>
          )}
        </YStack>

        {/* Content */}
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="600" color="$color" numberOfLines={1}>
            {cookbook.name}
          </Text>
          <Text fontSize={14} color="$foregroundMuted">
            {cookbook.recipeCount} recipes
          </Text>
        </YStack>

        {/* Selection indicator */}
        {selected && (
          <YStack
            width={24}
            height={24}
            borderRadius="$10"
            backgroundColor="$primary"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          </YStack>
        )}
      </XStack>
    </Card>
  );
}
