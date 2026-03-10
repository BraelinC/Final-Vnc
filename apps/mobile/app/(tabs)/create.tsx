import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState, useCallback, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  XStack,
  YStack,
  Text,
  ScrollView,
  Image,
  useTheme,
} from "tamagui";
import {
  Button,
  Card,
  Input,
  TextArea,
  Badge,
  Sheet,
  SheetHeader,
  SheetContent,
} from "@healthymama/ui";

type TabType = "details" | "ingredients" | "instructions" | "nutrition";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Instruction {
  id: string;
  step: number;
  text: string;
  imageUrl?: string;
}

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

export default function CreateRecipeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [tags, setTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [nutrition, setNutrition] = useState<NutritionInfo>({});

  // UI state
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [ingredientSheetOpen, setIngredientSheetOpen] = useState(false);

  // Tab animation
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // Tab configuration
  const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "details", label: "Details", icon: "document-text-outline" },
    { key: "ingredients", label: "Ingredients", icon: "list-outline" },
    { key: "instructions", label: "Steps", icon: "checkbox-outline" },
    { key: "nutrition", label: "Nutrition", icon: "nutrition-outline" },
  ];

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    const index = tabs.findIndex((t) => t.key === tab);
    Animated.spring(tabIndicatorAnim, {
      toValue: index,
      friction: 8,
      useNativeDriver: true,
    }).start();
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  // Handle image pick
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Add ingredient
  const addIngredient = (ingredient: Omit<Ingredient, "id">) => {
    setIngredients((prev) => [
      ...prev,
      { ...ingredient, id: Date.now().toString() },
    ]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add instruction
  const addInstruction = () => {
    setInstructions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        step: prev.length + 1,
        text: "",
      },
    ]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Update instruction
  const updateInstruction = (id: string, text: string) => {
    setInstructions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, text } : i))
    );
  };

  // Remove instruction
  const removeInstruction = (id: string) => {
    setInstructions((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.map((i, index) => ({ ...i, step: index + 1 }));
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Save recipe
  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  // Validation
  const isValid = title.trim().length > 0;

  // Tab indicator position
  const tabWidth = 100 / tabs.length;
  const indicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => `${i * tabWidth}%`),
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
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
          <Pressable onPress={() => router.back()}>
            <XStack alignItems="center" gap="$1">
              <Ionicons name="chevron-back" size={24} color={theme.color?.val} />
              <Text fontSize={16} color="$color">
                Cancel
              </Text>
            </XStack>
          </Pressable>

          <Text fontSize={18} fontWeight="700" color="$color">
            Create Recipe
          </Text>

          <Button
            variant="primary"
            size="sm"
            onPress={handleSave}
            loading={saving}
            disabled={!isValid || saving}
          >
            Save
          </Button>
        </XStack>

        {/* Tab bar */}
        <YStack borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack position="relative">
            {tabs.map((tab) => (
              <YStack
                key={tab.key}
                flex={1}
                paddingVertical="$3"
                alignItems="center"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => handleTabChange(tab.key)}
              >
                <XStack alignItems="center" gap="$1.5">
                  <Ionicons
                    name={tab.icon}
                    size={18}
                    color={
                      activeTab === tab.key
                        ? theme.primary?.val
                        : theme.foregroundMuted?.val
                    }
                  />
                  <Text
                    fontSize={13}
                    fontWeight={activeTab === tab.key ? "600" : "400"}
                    color={activeTab === tab.key ? "$primary" : "$foregroundMuted"}
                  >
                    {tab.label}
                  </Text>
                </XStack>
              </YStack>
            ))}

            {/* Animated indicator */}
            <Animated.View
              style={{
                position: "absolute",
                bottom: 0,
                left: indicatorPosition,
                width: `${tabWidth}%`,
                height: 2,
                backgroundColor: theme.primary?.val,
              }}
            />
          </XStack>
        </YStack>

        {/* Content */}
        <ScrollView
          flex={1}
          padding="$4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === "details" && (
            <DetailsTab
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              imageUrl={imageUrl}
              onPickImage={handlePickImage}
              prepTime={prepTime}
              setPrepTime={setPrepTime}
              cookTime={cookTime}
              setCookTime={setCookTime}
              servings={servings}
              setServings={setServings}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              tags={tags}
              onAddTag={() => setTagSheetOpen(true)}
              onRemoveTag={removeTag}
            />
          )}

          {activeTab === "ingredients" && (
            <IngredientsTab
              ingredients={ingredients}
              onAdd={() => setIngredientSheetOpen(true)}
              onRemove={removeIngredient}
            />
          )}

          {activeTab === "instructions" && (
            <InstructionsTab
              instructions={instructions}
              onAdd={addInstruction}
              onUpdate={updateInstruction}
              onRemove={removeInstruction}
            />
          )}

          {activeTab === "nutrition" && (
            <NutritionTab nutrition={nutrition} setNutrition={setNutrition} />
          )}

          {/* Bottom padding for keyboard */}
          <YStack height={100} />
        </ScrollView>

        {/* Tag Sheet */}
        <Sheet
          open={tagSheetOpen}
          onOpenChange={setTagSheetOpen}
          snapPoints={[40]}
        >
          <SheetHeader>
            <Text fontSize={18} fontWeight="700" color="$color">
              Add Tag
            </Text>
          </SheetHeader>
          <SheetContent>
            <YStack gap="$3">
              <Input
                placeholder="Enter tag name..."
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <Button variant="primary" onPress={addTag} disabled={!tagInput.trim()}>
                Add Tag
              </Button>

              {/* Suggested tags */}
              <YStack gap="$2">
                <Text fontSize={14} color="$foregroundMuted">
                  Suggested tags
                </Text>
                <XStack flexWrap="wrap" gap="$2">
                  {["Healthy", "Quick", "Vegetarian", "Gluten-free", "Low-carb"].map(
                    (tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        pressStyle={{ opacity: 0.7 }}
                        onPress={() => {
                          if (!tags.includes(tag)) {
                            setTags((prev) => [...prev, tag]);
                            setTagSheetOpen(false);
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    )
                  )}
                </XStack>
              </YStack>
            </YStack>
          </SheetContent>
        </Sheet>

        {/* Ingredient Sheet */}
        <IngredientSheet
          open={ingredientSheetOpen}
          onOpenChange={setIngredientSheetOpen}
          onAdd={addIngredient}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}

// Details Tab
interface DetailsTabProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUrl: string | null;
  onPickImage: () => void;
  prepTime: string;
  setPrepTime: (v: string) => void;
  cookTime: string;
  setCookTime: (v: string) => void;
  servings: string;
  setServings: (v: string) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (v: "easy" | "medium" | "hard") => void;
  tags: string[];
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

function DetailsTab({
  title,
  setTitle,
  description,
  setDescription,
  imageUrl,
  onPickImage,
  prepTime,
  setPrepTime,
  cookTime,
  setCookTime,
  servings,
  setServings,
  difficulty,
  setDifficulty,
  tags,
  onAddTag,
  onRemoveTag,
}: DetailsTabProps) {
  const theme = useTheme();

  return (
    <YStack gap="$4">
      {/* Image picker */}
      <YStack
        height={200}
        backgroundColor="$gray100"
        borderRadius="$5"
        overflow="hidden"
        pressStyle={{ opacity: 0.8 }}
        onPress={onPickImage}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} width="100%" height="100%" resizeMode="cover" />
        ) : (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$2">
            <Ionicons name="camera-outline" size={40} color={theme.gray400?.val} />
            <Text fontSize={14} color="$foregroundMuted">
              Tap to add cover photo
            </Text>
          </YStack>
        )}
      </YStack>

      {/* Title */}
      <Input
        label="Recipe Title"
        placeholder="Enter recipe title..."
        value={title}
        onChangeText={setTitle}
        size="lg"
      />

      {/* Description */}
      <TextArea
        label="Description"
        placeholder="Describe your recipe..."
        value={description}
        onChangeText={setDescription}
      />

      {/* Time inputs */}
      <XStack gap="$3">
        <YStack flex={1}>
          <Input
            label="Prep Time"
            placeholder="15"
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
            rightElement={
              <Text fontSize={14} color="$foregroundMuted">
                min
              </Text>
            }
          />
        </YStack>
        <YStack flex={1}>
          <Input
            label="Cook Time"
            placeholder="30"
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
            rightElement={
              <Text fontSize={14} color="$foregroundMuted">
                min
              </Text>
            }
          />
        </YStack>
      </XStack>

      {/* Servings */}
      <Input
        label="Servings"
        placeholder="4"
        value={servings}
        onChangeText={setServings}
        keyboardType="numeric"
        rightElement={
          <Text fontSize={14} color="$foregroundMuted">
            servings
          </Text>
        }
      />

      {/* Difficulty */}
      <YStack gap="$2">
        <Text fontSize={14} fontWeight="500" color="$color">
          Difficulty
        </Text>
        <XStack gap="$2">
          {(["easy", "medium", "hard"] as const).map((level) => (
            <Badge
              key={level}
              variant={difficulty === level ? "primary" : "outline"}
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setDifficulty(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Badge>
          ))}
        </XStack>
      </YStack>

      {/* Tags */}
      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize={14} fontWeight="500" color="$color">
            Tags
          </Text>
          <Button variant="ghost" size="sm" onPress={onAddTag}>
            Add Tag
          </Button>
        </XStack>
        <XStack flexWrap="wrap" gap="$2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="primarySoft"
              icon={
                <Pressable onPress={() => onRemoveTag(tag)}>
                  <Ionicons name="close" size={14} color={theme.primary?.val} />
                </Pressable>
              }
            >
              {tag}
            </Badge>
          ))}
          {tags.length === 0 && (
            <Text fontSize={14} color="$foregroundMuted">
              No tags added yet
            </Text>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}

// Ingredients Tab
interface IngredientsTabProps {
  ingredients: Ingredient[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function IngredientsTab({ ingredients, onAdd, onRemove }: IngredientsTabProps) {
  const theme = useTheme();

  return (
    <YStack gap="$4">
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={16} fontWeight="600" color="$color">
          {ingredients.length} Ingredients
        </Text>
        <Button variant="primary" size="sm" onPress={onAdd}>
          Add Ingredient
        </Button>
      </XStack>

      {ingredients.length === 0 ? (
        <Card variant="flat">
          <YStack alignItems="center" paddingVertical="$6" gap="$2">
            <Ionicons name="list-outline" size={48} color={theme.gray300?.val} />
            <Text fontSize={14} color="$foregroundMuted" textAlign="center">
              No ingredients added yet.{"\n"}Tap "Add Ingredient" to get started.
            </Text>
          </YStack>
        </Card>
      ) : (
        <YStack gap="$2">
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id} variant="flat" size="sm">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2" flex={1}>
                  <Text fontSize={14} fontWeight="500" color="$primary">
                    {ingredient.amount} {ingredient.unit}
                  </Text>
                  <Text fontSize={14} color="$color">
                    {ingredient.name}
                  </Text>
                </XStack>
                <Pressable onPress={() => onRemove(ingredient.id)}>
                  <Ionicons name="trash-outline" size={18} color={theme.error?.val} />
                </Pressable>
              </XStack>
            </Card>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

// Instructions Tab
interface InstructionsTabProps {
  instructions: Instruction[];
  onAdd: () => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

function InstructionsTab({
  instructions,
  onAdd,
  onUpdate,
  onRemove,
}: InstructionsTabProps) {
  const theme = useTheme();

  return (
    <YStack gap="$4">
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={16} fontWeight="600" color="$color">
          {instructions.length} Steps
        </Text>
        <Button variant="primary" size="sm" onPress={onAdd}>
          Add Step
        </Button>
      </XStack>

      {instructions.length === 0 ? (
        <Card variant="flat">
          <YStack alignItems="center" paddingVertical="$6" gap="$2">
            <Ionicons name="checkbox-outline" size={48} color={theme.gray300?.val} />
            <Text fontSize={14} color="$foregroundMuted" textAlign="center">
              No steps added yet.{"\n"}Tap "Add Step" to get started.
            </Text>
          </YStack>
        </Card>
      ) : (
        <YStack gap="$3">
          {instructions.map((instruction) => (
            <Card key={instruction.id} variant="outline" size="sm">
              <YStack gap="$2">
                <XStack alignItems="center" justifyContent="space-between">
                  <Badge variant="primary" size="sm">
                    Step {instruction.step}
                  </Badge>
                  <Pressable onPress={() => onRemove(instruction.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.error?.val}
                    />
                  </Pressable>
                </XStack>
                <TextArea
                  placeholder="Describe this step..."
                  value={instruction.text}
                  onChangeText={(text) => onUpdate(instruction.id, text)}
                />
              </YStack>
            </Card>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

// Nutrition Tab
interface NutritionTabProps {
  nutrition: NutritionInfo;
  setNutrition: (v: NutritionInfo) => void;
}

function NutritionTab({ nutrition, setNutrition }: NutritionTabProps) {
  const updateField = (field: keyof NutritionInfo, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setNutrition({ ...nutrition, [field]: numValue });
  };

  const fields: { key: keyof NutritionInfo; label: string; unit: string }[] = [
    { key: "calories", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbohydrates", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
    { key: "fiber", label: "Fiber", unit: "g" },
    { key: "sodium", label: "Sodium", unit: "mg" },
  ];

  return (
    <YStack gap="$4">
      <Text fontSize={14} color="$foregroundMuted">
        Nutritional information per serving (optional)
      </Text>

      <YStack gap="$3">
        {fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            placeholder="0"
            value={nutrition[field.key]?.toString() || ""}
            onChangeText={(v) => updateField(field.key, v)}
            keyboardType="numeric"
            rightElement={
              <Text fontSize={14} color="$foregroundMuted">
                {field.unit}
              </Text>
            }
          />
        ))}
      </YStack>
    </YStack>
  );
}

// Ingredient Sheet
interface IngredientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (ingredient: Omit<Ingredient, "id">) => void;
}

function IngredientSheet({ open, onOpenChange, onAdd }: IngredientSheetProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("cups");

  const units = ["cups", "tbsp", "tsp", "oz", "g", "ml", "pieces", "whole"];

  const handleAdd = () => {
    if (name.trim() && amount.trim()) {
      onAdd({ name: name.trim(), amount: amount.trim(), unit });
      setName("");
      setAmount("");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[50]}>
      <SheetHeader>
        <Text fontSize={18} fontWeight="700" color="$color">
          Add Ingredient
        </Text>
      </SheetHeader>
      <SheetContent>
        <YStack gap="$4">
          <Input
            label="Ingredient Name"
            placeholder="e.g., All-purpose flour"
            value={name}
            onChangeText={setName}
          />

          <XStack gap="$3">
            <YStack flex={1}>
              <Input
                label="Amount"
                placeholder="2"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </YStack>
            <YStack flex={1} gap="$2">
              <Text fontSize={14} fontWeight="500" color="$color">
                Unit
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {units.slice(0, 4).map((u) => (
                  <Badge
                    key={u}
                    variant={unit === u ? "primary" : "outline"}
                    size="sm"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => setUnit(u)}
                  >
                    {u}
                  </Badge>
                ))}
              </XStack>
            </YStack>
          </XStack>

          <Button
            variant="primary"
            fullWidth
            onPress={handleAdd}
            disabled={!name.trim() || !amount.trim()}
          >
            Add Ingredient
          </Button>
        </YStack>
      </SheetContent>
    </Sheet>
  );
}
