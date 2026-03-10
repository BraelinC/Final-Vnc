import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Text, Input, ScrollView, useTheme } from "tamagui";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetFooter,
  Button,
} from "@healthymama/ui";
import { CookbookCardCompact } from "./CookbookCard";

interface Cookbook {
  _id: string;
  name: string;
  description?: string;
  imageUrls?: string[];
  recipeCount: number;
  isPublic: boolean;
}

interface CookbookSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cookbooks: Cookbook[];
  selectedCookbookIds?: string[];
  multiSelect?: boolean;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  onConfirm: (selectedIds: string[]) => void;
  onCreateNew?: () => void;
}

export function CookbookSelectionSheet({
  open,
  onOpenChange,
  cookbooks,
  selectedCookbookIds = [],
  multiSelect = false,
  loading = false,
  title = "Select Cookbook",
  subtitle,
  confirmLabel = "Confirm",
  onConfirm,
  onCreateNew,
}: CookbookSelectionSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedCookbookIds);

  // Filter cookbooks based on search
  const filteredCookbooks = useMemo(() => {
    if (!searchQuery.trim()) return cookbooks;
    const query = searchQuery.toLowerCase();
    return cookbooks.filter(
      (cookbook) =>
        cookbook.name.toLowerCase().includes(query) ||
        cookbook.description?.toLowerCase().includes(query)
    );
  }, [cookbooks, searchQuery]);

  // Handle cookbook selection
  const handleSelect = (cookbook: Cookbook) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(cookbook._id)
          ? prev.filter((id) => id !== cookbook._id)
          : [...prev, cookbook._id]
      );
    } else {
      setSelected([cookbook._id]);
      // Auto-confirm on single select
      onConfirm([cookbook._id]);
      onOpenChange(false);
    }
  };

  // Handle confirmation
  const handleConfirm = () => {
    onConfirm(selected);
    onOpenChange(false);
  };

  // Reset selection when sheet opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelected(selectedCookbookIds);
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      snapPoints={[85, 50]}
      dismissOnSnapToBottom
    >
      <SheetHeader>
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <Text fontSize={20} fontWeight="700" color="$color">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize={14} color="$foregroundMuted">
                {subtitle}
              </Text>
            )}
          </YStack>
          {multiSelect && selected.length > 0 && (
            <Text fontSize={14} color="$primary" fontWeight="600">
              {selected.length} selected
            </Text>
          )}
        </XStack>
      </SheetHeader>

      <SheetContent>
        {/* Search bar */}
        <XStack
          backgroundColor="$gray100"
          borderRadius="$4"
          paddingHorizontal="$3"
          alignItems="center"
          gap="$2"
          marginBottom="$3"
        >
          <Ionicons name="search" size={20} color={theme.gray400?.val} />
          <Input
            flex={1}
            placeholder="Search cookbooks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            backgroundColor="transparent"
            borderWidth={0}
            size="md"
          />
          {searchQuery.length > 0 && (
            <YStack
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.gray400?.val}
              />
            </YStack>
          )}
        </XStack>

        {/* Create new cookbook button */}
        {onCreateNew && (
          <YStack
            borderWidth={2}
            borderColor="$primary"
            borderStyle="dashed"
            borderRadius="$4"
            padding="$3"
            alignItems="center"
            justifyContent="center"
            marginBottom="$3"
            pressStyle={{ opacity: 0.7, backgroundColor: "$gray50" }}
            onPress={onCreateNew}
          >
            <XStack alignItems="center" gap="$2">
              <Ionicons name="add-circle" size={24} color={theme.primary?.val} />
              <Text fontSize={16} fontWeight="600" color="$primary">
                Create New Cookbook
              </Text>
            </XStack>
          </YStack>
        )}

        {/* Cookbook list */}
        <ScrollView showsVerticalScrollIndicator={false} flex={1}>
          {loading ? (
            <YStack gap="$3">
              {[1, 2, 3].map((i) => (
                <CookbookSkeletonCompact key={i} />
              ))}
            </YStack>
          ) : filteredCookbooks.length === 0 ? (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              paddingVertical="$8"
              gap="$3"
            >
              <Ionicons
                name="book-outline"
                size={48}
                color={theme.gray300?.val}
              />
              <Text fontSize={16} color="$foregroundMuted" textAlign="center">
                {searchQuery
                  ? "No cookbooks match your search"
                  : "No cookbooks yet"}
              </Text>
              {onCreateNew && !searchQuery && (
                <Button variant="primary" onPress={onCreateNew}>
                  Create Your First Cookbook
                </Button>
              )}
            </YStack>
          ) : (
            <YStack gap="$3" paddingBottom={insets.bottom + 80}>
              {filteredCookbooks.map((cookbook) => (
                <CookbookCardCompact
                  key={cookbook._id}
                  cookbook={cookbook}
                  selected={selected.includes(cookbook._id)}
                  onPress={() => handleSelect(cookbook)}
                />
              ))}
            </YStack>
          )}
        </ScrollView>
      </SheetContent>

      {/* Footer with confirm button (only for multi-select) */}
      {multiSelect && (
        <SheetFooter>
          <Button variant="ghost" flex={1} onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            flex={2}
            onPress={handleConfirm}
            disabled={selected.length === 0}
          >
            {confirmLabel} {selected.length > 0 && `(${selected.length})`}
          </Button>
        </SheetFooter>
      )}
    </Sheet>
  );
}

// Skeleton for compact cookbook card
function CookbookSkeletonCompact() {
  return (
    <YStack
      backgroundColor="$gray100"
      borderRadius="$4"
      padding="$3"
    >
      <XStack alignItems="center" gap="$3">
        <YStack
          width={56}
          height={56}
          borderRadius="$3"
          backgroundColor="$gray200"
        />
        <YStack flex={1} gap="$2">
          <YStack
            width="70%"
            height={18}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
          <YStack
            width="40%"
            height={14}
            borderRadius="$2"
            backgroundColor="$gray200"
          />
        </YStack>
      </XStack>
    </YStack>
  );
}

// Quick action sheet for single cookbook selection with recent
interface QuickCookbookSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cookbooks: Cookbook[];
  recentCookbookIds?: string[];
  onSelect: (cookbookId: string) => void;
  onCreateNew?: () => void;
}

export function QuickCookbookSelect({
  open,
  onOpenChange,
  cookbooks,
  recentCookbookIds = [],
  onSelect,
  onCreateNew,
}: QuickCookbookSelectProps) {
  const theme = useTheme();

  // Get recent cookbooks
  const recentCookbooks = useMemo(() => {
    return recentCookbookIds
      .map((id) => cookbooks.find((c) => c._id === id))
      .filter(Boolean) as Cookbook[];
  }, [cookbooks, recentCookbookIds]);

  const otherCookbooks = useMemo(() => {
    return cookbooks.filter((c) => !recentCookbookIds.includes(c._id));
  }, [cookbooks, recentCookbookIds]);

  const handleSelect = (cookbook: Cookbook) => {
    onSelect(cookbook._id);
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
      dismissOnSnapToBottom
    >
      <SheetHeader>
        <Text fontSize={18} fontWeight="700" color="$color">
          Add to Cookbook
        </Text>
      </SheetHeader>

      <SheetContent>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Recent section */}
          {recentCookbooks.length > 0 && (
            <YStack marginBottom="$4">
              <Text
                fontSize={12}
                fontWeight="600"
                color="$foregroundMuted"
                textTransform="uppercase"
                letterSpacing={0.5}
                marginBottom="$2"
              >
                Recent
              </Text>
              <YStack gap="$2">
                {recentCookbooks.map((cookbook) => (
                  <QuickSelectItem
                    key={cookbook._id}
                    cookbook={cookbook}
                    onPress={() => handleSelect(cookbook)}
                  />
                ))}
              </YStack>
            </YStack>
          )}

          {/* All cookbooks section */}
          {otherCookbooks.length > 0 && (
            <YStack>
              <Text
                fontSize={12}
                fontWeight="600"
                color="$foregroundMuted"
                textTransform="uppercase"
                letterSpacing={0.5}
                marginBottom="$2"
              >
                All Cookbooks
              </Text>
              <YStack gap="$2">
                {otherCookbooks.map((cookbook) => (
                  <QuickSelectItem
                    key={cookbook._id}
                    cookbook={cookbook}
                    onPress={() => handleSelect(cookbook)}
                  />
                ))}
              </YStack>
            </YStack>
          )}

          {/* Create new */}
          {onCreateNew && (
            <YStack
              marginTop="$4"
              paddingTop="$4"
              borderTopWidth={1}
              borderTopColor="$borderColor"
            >
              <XStack
                alignItems="center"
                gap="$3"
                padding="$3"
                borderRadius="$4"
                pressStyle={{ backgroundColor: "$gray50" }}
                onPress={onCreateNew}
              >
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$primary"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons name="add" size={24} color="#ffffff" />
                </YStack>
                <Text fontSize={16} fontWeight="600" color="$primary">
                  Create New Cookbook
                </Text>
              </XStack>
            </YStack>
          )}
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}

// Quick select item component
function QuickSelectItem({
  cookbook,
  onPress,
}: {
  cookbook: Cookbook;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      alignItems="center"
      gap="$3"
      padding="$3"
      borderRadius="$4"
      backgroundColor="$gray50"
      pressStyle={{ backgroundColor: "$gray100" }}
      onPress={onPress}
    >
      <YStack
        width={40}
        height={40}
        borderRadius="$3"
        backgroundColor="$gray200"
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name="book" size={20} color={theme.gray500?.val} />
      </YStack>
      <YStack flex={1}>
        <Text fontSize={15} fontWeight="500" color="$color" numberOfLines={1}>
          {cookbook.name}
        </Text>
        <Text fontSize={13} color="$foregroundMuted">
          {cookbook.recipeCount} recipes
        </Text>
      </YStack>
      <Ionicons name="add-circle-outline" size={24} color={theme.primary?.val} />
    </XStack>
  );
}
