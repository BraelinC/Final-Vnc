import { forwardRef, useState } from "react";
import {
  Input as TamaguiInput,
  InputProps as TamaguiInputProps,
  styled,
  GetProps,
  XStack,
  YStack,
  Text,
} from "tamagui";

// Styled input
const StyledInput = styled(TamaguiInput, {
  name: "Input",
  fontFamily: "$body",
  fontSize: 16,
  backgroundColor: "$background",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$4",
  paddingHorizontal: "$4",
  color: "$color",
  placeholderTextColor: "$placeholderColor",

  focusStyle: {
    borderColor: "$borderColorFocus",
    borderWidth: 2,
  },

  variants: {
    variant: {
      default: {},
      filled: {
        backgroundColor: "$gray100",
        borderColor: "transparent",
        focusStyle: {
          backgroundColor: "$background",
          borderColor: "$borderColorFocus",
          borderWidth: 2,
        },
      },
      underline: {
        borderWidth: 0,
        borderBottomWidth: 1,
        borderRadius: 0,
        paddingHorizontal: 0,
        focusStyle: {
          borderBottomWidth: 2,
          borderColor: "$borderColorFocus",
        },
      },
    },

    size: {
      sm: {
        height: 40,
        fontSize: 14,
        paddingHorizontal: "$3",
      },
      md: {
        height: 48,
        fontSize: 16,
        paddingHorizontal: "$4",
      },
      lg: {
        height: 56,
        fontSize: 18,
        paddingHorizontal: "$5",
      },
    },

    error: {
      true: {
        borderColor: "$error",
        focusStyle: {
          borderColor: "$error",
        },
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        backgroundColor: "$gray100",
        pointerEvents: "none",
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

type StyledInputProps = GetProps<typeof StyledInput>;

export interface InputProps extends Omit<StyledInputProps, "disabled"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

// Input with wrapper for label and error
export const Input = forwardRef<typeof TamaguiInput, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftElement,
      rightElement,
      error,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = error || !!errorMessage;

    return (
      <YStack gap="$1.5">
        {label && (
          <Text
            fontSize={14}
            fontWeight="500"
            color={hasError ? "$error" : isFocused ? "$primary" : "$color"}
          >
            {label}
          </Text>
        )}

        <XStack alignItems="center">
          {leftElement && <XStack marginRight="$2">{leftElement}</XStack>}

          <StyledInput
            ref={ref as any}
            flex={1}
            error={hasError}
            disabled={disabled}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {rightElement && <XStack marginLeft="$2">{rightElement}</XStack>}
        </XStack>

        {(errorMessage || helperText) && (
          <Text
            fontSize={12}
            color={errorMessage ? "$error" : "$foregroundMuted"}
          >
            {errorMessage || helperText}
          </Text>
        )}
      </YStack>
    );
  }
);

Input.displayName = "Input";

// TextArea component
const StyledTextArea = styled(TamaguiInput, {
  name: "TextArea",
  fontFamily: "$body",
  fontSize: 16,
  backgroundColor: "$background",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$4",
  padding: "$3",
  color: "$color",
  placeholderTextColor: "$placeholderColor",
  textAlignVertical: "top",
  minHeight: 100,

  focusStyle: {
    borderColor: "$borderColorFocus",
    borderWidth: 2,
  },

  variants: {
    error: {
      true: {
        borderColor: "$error",
      },
    },
  } as const,
});

export interface TextAreaProps extends GetProps<typeof StyledTextArea> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const TextArea = forwardRef<typeof TamaguiInput, TextAreaProps>(
  ({ label, helperText, errorMessage, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = error || !!errorMessage;

    return (
      <YStack gap="$1.5">
        {label && (
          <Text
            fontSize={14}
            fontWeight="500"
            color={hasError ? "$error" : isFocused ? "$primary" : "$color"}
          >
            {label}
          </Text>
        )}

        <StyledTextArea
          ref={ref as any}
          multiline
          numberOfLines={4}
          error={hasError}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {(errorMessage || helperText) && (
          <Text
            fontSize={12}
            color={errorMessage ? "$error" : "$foregroundMuted"}
          >
            {errorMessage || helperText}
          </Text>
        )}
      </YStack>
    );
  }
);

TextArea.displayName = "TextArea";

// Re-export
export type { TamaguiInputProps };
