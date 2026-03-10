import { createAnimations } from "@tamagui/animations-react-native";
import { createInterFont } from "@tamagui/font-inter";
import { shorthands } from "@tamagui/shorthands";
import { themes as baseThemes, tokens as baseTokens } from "@tamagui/themes";
import { createTamagui, createTokens } from "tamagui";

// Custom animations
const animations = createAnimations({
  fast: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: "spring",
    damping: 15,
    mass: 0.9,
    stiffness: 150,
  },
  slow: {
    type: "spring",
    damping: 20,
    mass: 1,
    stiffness: 100,
  },
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: "spring",
    damping: 20,
    mass: 1.4,
    stiffness: 60,
  },
  quick: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 350,
  },
  pulse: {
    type: "timing",
    duration: 1000,
  },
  fadeIn: {
    type: "timing",
    duration: 300,
  },
});

// Inter font family
const headingFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    11: 56,
    12: 64,
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "800",
    7: "900",
  },
  letterSpacing: {
    1: -0.5,
    2: -0.25,
    3: 0,
  },
});

const bodyFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    11: 56,
    12: 64,
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "800",
    7: "900",
  },
});

// Custom tokens
const tokens = createTokens({
  ...baseTokens,
  color: {
    // Primary - Pink
    primary: "#ec4899",
    primaryLight: "#f472b6",
    primaryDark: "#db2777",
    primaryForeground: "#ffffff",

    // Secondary - Teal
    secondary: "#14b8a6",
    secondaryLight: "#2dd4bf",
    secondaryDark: "#0d9488",
    secondaryForeground: "#ffffff",

    // Accent - Red (for gradients)
    accent: "#dc2626",
    accentLight: "#ef4444",
    accentDark: "#b91c1c",
    accentForeground: "#ffffff",

    // Gray scale
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827",
    gray950: "#030712",

    // Semantic colors
    success: "#22c55e",
    successLight: "#4ade80",
    successDark: "#16a34a",
    successForeground: "#ffffff",

    warning: "#f59e0b",
    warningLight: "#fbbf24",
    warningDark: "#d97706",
    warningForeground: "#000000",

    error: "#ef4444",
    errorLight: "#f87171",
    errorDark: "#dc2626",
    errorForeground: "#ffffff",

    info: "#3b82f6",
    infoLight: "#60a5fa",
    infoDark: "#2563eb",
    infoForeground: "#ffffff",

    // Background
    background: "#ffffff",
    backgroundSubtle: "#f9fafb",
    backgroundMuted: "#f3f4f6",

    // Foreground
    foreground: "#111827",
    foregroundMuted: "#6b7280",
    foregroundSubtle: "#9ca3af",

    // Border
    border: "#e5e7eb",
    borderFocus: "#ec4899",

    // Overlay
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.3)",

    // White/Black
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    true: 16,
  },
  size: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    true: 16,
  },
  radius: {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 12,
    6: 16,
    7: 20,
    8: 24,
    9: 32,
    10: 9999,
    true: 8,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
    modal: 1000,
    popover: 1100,
    tooltip: 1200,
    toast: 1300,
  },
});

// Light theme
const lightTheme = {
  background: tokens.color.background,
  backgroundHover: tokens.color.gray50,
  backgroundPress: tokens.color.gray100,
  backgroundFocus: tokens.color.gray50,
  backgroundStrong: tokens.color.gray100,
  backgroundTransparent: tokens.color.transparent,

  color: tokens.color.foreground,
  colorHover: tokens.color.gray800,
  colorPress: tokens.color.gray900,
  colorFocus: tokens.color.gray800,
  colorTransparent: tokens.color.transparent,

  borderColor: tokens.color.border,
  borderColorHover: tokens.color.gray300,
  borderColorFocus: tokens.color.borderFocus,
  borderColorPress: tokens.color.gray400,

  placeholderColor: tokens.color.gray400,

  // Brand colors
  primary: tokens.color.primary,
  primaryLight: tokens.color.primaryLight,
  primaryDark: tokens.color.primaryDark,

  secondary: tokens.color.secondary,
  secondaryLight: tokens.color.secondaryLight,
  secondaryDark: tokens.color.secondaryDark,

  accent: tokens.color.accent,
  accentLight: tokens.color.accentLight,
  accentDark: tokens.color.accentDark,

  // Semantic
  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,
  info: tokens.color.info,

  // Gray scale
  gray50: tokens.color.gray50,
  gray100: tokens.color.gray100,
  gray200: tokens.color.gray200,
  gray300: tokens.color.gray300,
  gray400: tokens.color.gray400,
  gray500: tokens.color.gray500,
  gray600: tokens.color.gray600,
  gray700: tokens.color.gray700,
  gray800: tokens.color.gray800,
  gray900: tokens.color.gray900,

  // Shadows (for themed components)
  shadowColor: "rgba(0, 0, 0, 0.1)",
  shadowColorStrong: "rgba(0, 0, 0, 0.25)",
};

// Dark theme
const darkTheme = {
  background: tokens.color.gray900,
  backgroundHover: tokens.color.gray800,
  backgroundPress: tokens.color.gray700,
  backgroundFocus: tokens.color.gray800,
  backgroundStrong: tokens.color.gray800,
  backgroundTransparent: tokens.color.transparent,

  color: tokens.color.gray50,
  colorHover: tokens.color.gray100,
  colorPress: tokens.color.white,
  colorFocus: tokens.color.gray100,
  colorTransparent: tokens.color.transparent,

  borderColor: tokens.color.gray700,
  borderColorHover: tokens.color.gray600,
  borderColorFocus: tokens.color.primaryLight,
  borderColorPress: tokens.color.gray500,

  placeholderColor: tokens.color.gray500,

  // Brand colors (slightly adjusted for dark mode)
  primary: tokens.color.primaryLight,
  primaryLight: tokens.color.primary,
  primaryDark: tokens.color.primaryDark,

  secondary: tokens.color.secondaryLight,
  secondaryLight: tokens.color.secondary,
  secondaryDark: tokens.color.secondaryDark,

  accent: tokens.color.accentLight,
  accentLight: tokens.color.accent,
  accentDark: tokens.color.accentDark,

  // Semantic
  success: tokens.color.successLight,
  warning: tokens.color.warningLight,
  error: tokens.color.errorLight,
  info: tokens.color.infoLight,

  // Gray scale (inverted)
  gray50: tokens.color.gray900,
  gray100: tokens.color.gray800,
  gray200: tokens.color.gray700,
  gray300: tokens.color.gray600,
  gray400: tokens.color.gray500,
  gray500: tokens.color.gray400,
  gray600: tokens.color.gray300,
  gray700: tokens.color.gray200,
  gray800: tokens.color.gray100,
  gray900: tokens.color.gray50,

  // Shadows
  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowColorStrong: "rgba(0, 0, 0, 0.5)",
};

export const config = createTamagui({
  defaultFont: "body",
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
    // Brand sub-themes
    light_primary: {
      ...lightTheme,
      background: tokens.color.primary,
      backgroundHover: tokens.color.primaryDark,
      backgroundPress: tokens.color.primaryDark,
      color: tokens.color.white,
      colorHover: tokens.color.white,
    },
    dark_primary: {
      ...darkTheme,
      background: tokens.color.primaryDark,
      backgroundHover: tokens.color.primary,
      backgroundPress: tokens.color.primaryLight,
      color: tokens.color.white,
      colorHover: tokens.color.white,
    },
    light_secondary: {
      ...lightTheme,
      background: tokens.color.secondary,
      backgroundHover: tokens.color.secondaryDark,
      backgroundPress: tokens.color.secondaryDark,
      color: tokens.color.white,
      colorHover: tokens.color.white,
    },
    dark_secondary: {
      ...darkTheme,
      background: tokens.color.secondaryDark,
      backgroundHover: tokens.color.secondary,
      backgroundPress: tokens.color.secondaryLight,
      color: tokens.color.white,
      colorHover: tokens.color.white,
    },
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: "none" },
    pointerCoarse: { pointer: "coarse" },
  },
});

// Type exports
export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
