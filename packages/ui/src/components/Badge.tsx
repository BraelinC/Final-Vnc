import { forwardRef } from "react";
import { styled, XStack, Text, GetProps } from "tamagui";

// Styled badge container
const StyledBadge = styled(XStack, {
  name: "Badge",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: "$2.5",
  paddingVertical: "$1",
  borderRadius: "$10",
  gap: "$1.5",

  variants: {
    variant: {
      primary: {
        backgroundColor: "$primary",
      },
      secondary: {
        backgroundColor: "$secondary",
      },
      success: {
        backgroundColor: "$success",
      },
      warning: {
        backgroundColor: "$warning",
      },
      error: {
        backgroundColor: "$error",
      },
      info: {
        backgroundColor: "$info",
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$primary",
      },
      ghost: {
        backgroundColor: "$gray100",
      },
      // Soft variants with lighter backgrounds
      primarySoft: {
        backgroundColor: "rgba(236, 72, 153, 0.15)",
      },
      secondarySoft: {
        backgroundColor: "rgba(20, 184, 166, 0.15)",
      },
      successSoft: {
        backgroundColor: "rgba(34, 197, 94, 0.15)",
      },
      warningSoft: {
        backgroundColor: "rgba(245, 158, 11, 0.15)",
      },
      errorSoft: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
      },
      infoSoft: {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
      },
    },

    size: {
      sm: {
        paddingHorizontal: "$2",
        paddingVertical: "$0.5",
        height: 20,
      },
      md: {
        paddingHorizontal: "$2.5",
        paddingVertical: "$1",
        height: 26,
      },
      lg: {
        paddingHorizontal: "$3",
        paddingVertical: "$1.5",
        height: 32,
      },
    },
  } as const,

  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

// Badge text colors mapping
const textColorMap: Record<string, string> = {
  primary: "$white",
  secondary: "$white",
  success: "$white",
  warning: "$black",
  error: "$white",
  info: "$white",
  outline: "$primary",
  ghost: "$gray700",
  primarySoft: "$primary",
  secondarySoft: "$secondary",
  successSoft: "$success",
  warningSoft: "$warningDark",
  errorSoft: "$error",
  infoSoft: "$info",
};

type StyledBadgeProps = GetProps<typeof StyledBadge>;

export interface BadgeProps extends StyledBadgeProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge = forwardRef<XStack, BadgeProps>(
  ({ children, icon, variant = "primary", size = "md", ...props }, ref) => {
    const textColor = textColorMap[variant as string] || "$white";
    const fontSize = size === "sm" ? 10 : size === "md" ? 12 : 14;
    const fontWeight = "600";

    return (
      <StyledBadge ref={ref as any} variant={variant} size={size} {...props}>
        {icon}
        {typeof children === "string" ? (
          <Text color={textColor} fontSize={fontSize} fontWeight={fontWeight}>
            {children}
          </Text>
        ) : (
          children
        )}
      </StyledBadge>
    );
  }
);

Badge.displayName = "Badge";

// Dot badge (notification indicator)
const StyledDot = styled(XStack, {
  name: "BadgeDot",
  borderRadius: "$10",

  variants: {
    variant: {
      primary: { backgroundColor: "$primary" },
      secondary: { backgroundColor: "$secondary" },
      success: { backgroundColor: "$success" },
      warning: { backgroundColor: "$warning" },
      error: { backgroundColor: "$error" },
      info: { backgroundColor: "$info" },
    },
    size: {
      sm: { width: 6, height: 6 },
      md: { width: 8, height: 8 },
      lg: { width: 10, height: 10 },
    },
    pulse: {
      true: {
        animation: "pulse",
      },
    },
  } as const,

  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface BadgeDotProps extends GetProps<typeof StyledDot> {}

export const BadgeDot = forwardRef<XStack, BadgeDotProps>((props, ref) => {
  return <StyledDot ref={ref as any} {...props} />;
});

BadgeDot.displayName = "BadgeDot";

// Count badge (for notifications)
const StyledCount = styled(XStack, {
  name: "BadgeCount",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$10",
  minWidth: 20,
  height: 20,
  paddingHorizontal: "$1.5",
  backgroundColor: "$error",
});

export interface BadgeCountProps extends GetProps<typeof StyledCount> {
  count: number;
  max?: number;
}

export const BadgeCount = forwardRef<XStack, BadgeCountProps>(
  ({ count, max = 99, ...props }, ref) => {
    const displayCount = count > max ? `${max}+` : String(count);

    return (
      <StyledCount ref={ref as any} {...props}>
        <Text color="$white" fontSize={11} fontWeight="700">
          {displayCount}
        </Text>
      </StyledCount>
    );
  }
);

BadgeCount.displayName = "BadgeCount";
