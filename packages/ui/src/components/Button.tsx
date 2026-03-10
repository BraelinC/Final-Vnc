import { forwardRef } from "react";
import {
  Button as TamaguiButton,
  ButtonProps as TamaguiButtonProps,
  Spinner,
  styled,
  GetProps,
} from "tamagui";

// Styled button with variants
const StyledButton = styled(TamaguiButton, {
  name: "Button",
  fontFamily: "$body",
  fontWeight: "600",
  borderRadius: "$5",
  pressStyle: {
    opacity: 0.85,
    scale: 0.98,
  },
  animation: "fast",

  variants: {
    variant: {
      primary: {
        backgroundColor: "$primary",
        color: "$white",
        hoverStyle: {
          backgroundColor: "$primaryDark",
        },
        pressStyle: {
          backgroundColor: "$primaryDark",
        },
      },
      secondary: {
        backgroundColor: "$secondary",
        color: "$white",
        hoverStyle: {
          backgroundColor: "$secondaryDark",
        },
        pressStyle: {
          backgroundColor: "$secondaryDark",
        },
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: "$primary",
        color: "$primary",
        hoverStyle: {
          backgroundColor: "$primary",
          color: "$white",
        },
        pressStyle: {
          backgroundColor: "$primary",
          color: "$white",
        },
      },
      ghost: {
        backgroundColor: "transparent",
        color: "$primary",
        hoverStyle: {
          backgroundColor: "$gray100",
        },
        pressStyle: {
          backgroundColor: "$gray200",
        },
      },
      danger: {
        backgroundColor: "$error",
        color: "$white",
        hoverStyle: {
          backgroundColor: "$errorDark",
        },
        pressStyle: {
          backgroundColor: "$errorDark",
        },
      },
      success: {
        backgroundColor: "$success",
        color: "$white",
        hoverStyle: {
          backgroundColor: "$successDark",
        },
        pressStyle: {
          backgroundColor: "$successDark",
        },
      },
    },

    size: {
      sm: {
        height: 36,
        paddingHorizontal: "$3",
        fontSize: 14,
      },
      md: {
        height: 44,
        paddingHorizontal: "$4",
        fontSize: 16,
      },
      lg: {
        height: 52,
        paddingHorizontal: "$5",
        fontSize: 18,
      },
      xl: {
        height: 60,
        paddingHorizontal: "$6",
        fontSize: 20,
      },
    },

    fullWidth: {
      true: {
        width: "100%",
      },
    },

    rounded: {
      true: {
        borderRadius: "$10",
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },
  } as const,

  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

type StyledButtonProps = GetProps<typeof StyledButton>;

export interface ButtonProps extends Omit<StyledButtonProps, "disabled"> {
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<typeof TamaguiButton, ButtonProps>(
  (
    { children, loading, disabled, leftIcon, rightIcon, variant, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <StyledButton
        ref={ref as any}
        variant={variant}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Spinner
            size="small"
            color={
              variant === "outline" || variant === "ghost"
                ? "$primary"
                : "$white"
            }
          />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </StyledButton>
    );
  }
);

Button.displayName = "Button";

// Re-export for convenience
export type { TamaguiButtonProps };
