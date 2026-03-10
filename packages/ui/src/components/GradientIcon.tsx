import { forwardRef } from "react";
import { LinearGradient } from "@tamagui/linear-gradient";
import { styled, YStack, GetProps } from "tamagui";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Mask, Rect } from "react-native-svg";

// Container for gradient icon
const GradientIconContainer = styled(YStack, {
  name: "GradientIcon",
  alignItems: "center",
  justifyContent: "center",

  variants: {
    size: {
      sm: { width: 24, height: 24 },
      md: { width: 32, height: 32 },
      lg: { width: 40, height: 40 },
      xl: { width: 48, height: 48 },
    },
  } as const,

  defaultVariants: {
    size: "md",
  },
});

// Size map for icons
const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

type GradientIconContainerProps = GetProps<typeof GradientIconContainer>;

export interface GradientIconProps extends Omit<GradientIconContainerProps, "children"> {
  icon: React.ReactNode;
  colors?: [string, string];
  gradientDirection?: "horizontal" | "vertical" | "diagonal";
}

// GradientIcon using LinearGradient background approach
export const GradientIcon = forwardRef<YStack, GradientIconProps>(
  (
    {
      icon,
      colors = ["#dc2626", "#ec4899"], // Red to Pink gradient
      gradientDirection = "diagonal",
      size = "md",
      ...props
    },
    ref
  ) => {
    const iconSize = sizeMap[size as keyof typeof sizeMap] || 32;

    // Calculate gradient coordinates based on direction
    const gradientCoords = {
      horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
      diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
    }[gradientDirection];

    return (
      <GradientIconContainer ref={ref as any} size={size} {...props}>
        <LinearGradient
          colors={colors}
          start={gradientCoords.start}
          end={gradientCoords.end}
          width={iconSize}
          height={iconSize}
          borderRadius={iconSize / 4}
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </LinearGradient>
      </GradientIconContainer>
    );
  }
);

GradientIcon.displayName = "GradientIcon";

// Gradient text wrapper (for gradient-colored icons using SVG)
export interface GradientTextProps {
  children: React.ReactNode;
  colors?: [string, string];
  gradientId?: string;
}

// Note: For true gradient-colored icons (not background), you'll need to use
// the icon library's color prop with the gradient colors, or wrap with MaskedView
// on iOS. This component provides the gradient background approach.

// Circular gradient icon with border
const GradientCircleContainer = styled(YStack, {
  name: "GradientCircle",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$10",
  overflow: "hidden",

  variants: {
    size: {
      sm: { width: 36, height: 36 },
      md: { width: 48, height: 48 },
      lg: { width: 64, height: 64 },
      xl: { width: 80, height: 80 },
    },
  } as const,

  defaultVariants: {
    size: "md",
  },
});

const circleSizeMap = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
};

type GradientCircleContainerProps = GetProps<typeof GradientCircleContainer>;

export interface GradientCircleIconProps extends Omit<GradientCircleContainerProps, "children"> {
  icon: React.ReactNode;
  colors?: [string, string];
  iconColor?: string;
}

export const GradientCircleIcon = forwardRef<YStack, GradientCircleIconProps>(
  (
    {
      icon,
      colors = ["#dc2626", "#ec4899"],
      iconColor = "#ffffff",
      size = "md",
      ...props
    },
    ref
  ) => {
    const circleSize = circleSizeMap[size as keyof typeof circleSizeMap] || 48;

    return (
      <GradientCircleContainer ref={ref as any} size={size} {...props}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          width={circleSize}
          height={circleSize}
          borderRadius={circleSize / 2}
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </LinearGradient>
      </GradientCircleContainer>
    );
  }
);

GradientCircleIcon.displayName = "GradientCircleIcon";

// Brand gradient colors export for consistency
export const brandGradient = {
  redToPink: ["#dc2626", "#ec4899"] as [string, string],
  pinkToTeal: ["#ec4899", "#14b8a6"] as [string, string],
  tealToBlue: ["#14b8a6", "#3b82f6"] as [string, string],
  pinkToPurple: ["#ec4899", "#8b5cf6"] as [string, string],
};
