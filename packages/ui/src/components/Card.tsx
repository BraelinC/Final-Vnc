import { forwardRef } from "react";
import { styled, YStack, GetProps } from "tamagui";
import { shadows } from "../primitives/shadows";

// Styled card component
const StyledCard = styled(YStack, {
  name: "Card",
  backgroundColor: "$background",
  borderRadius: "$5",
  overflow: "hidden",

  variants: {
    variant: {
      elevated: {
        ...shadows.card,
      },
      flat: {
        backgroundColor: "$gray50",
      },
      outline: {
        borderWidth: 1,
        borderColor: "$borderColor",
      },
      ghost: {
        backgroundColor: "transparent",
      },
    },

    size: {
      sm: {
        padding: "$3",
      },
      md: {
        padding: "$4",
      },
      lg: {
        padding: "$5",
      },
    },

    pressable: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
        animation: "fast",
        cursor: "pointer",
      },
    },

    hoverable: {
      true: {
        hoverStyle: {
          backgroundColor: "$backgroundHover",
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: "elevated",
    size: "md",
  },
});

type StyledCardProps = GetProps<typeof StyledCard>;

export interface CardProps extends StyledCardProps {
  children?: React.ReactNode;
}

export const Card = forwardRef<YStack, CardProps>(
  ({ children, ...props }, ref) => {
    return (
      <StyledCard ref={ref as any} {...props}>
        {children}
      </StyledCard>
    );
  }
);

Card.displayName = "Card";

// Card Header
export const CardHeader = styled(YStack, {
  name: "CardHeader",
  gap: "$2",
  paddingBottom: "$3",
  borderBottomWidth: 1,
  borderBottomColor: "$borderColor",
  marginBottom: "$3",
});

// Card Content
export const CardContent = styled(YStack, {
  name: "CardContent",
  flex: 1,
});

// Card Footer
export const CardFooter = styled(YStack, {
  name: "CardFooter",
  gap: "$2",
  paddingTop: "$3",
  borderTopWidth: 1,
  borderTopColor: "$borderColor",
  marginTop: "$3",
});

// Card with image header
const CardWithImageContainer = styled(YStack, {
  name: "CardWithImage",
  backgroundColor: "$background",
  borderRadius: "$5",
  overflow: "hidden",
  ...shadows.card,
});

export interface CardWithImageProps extends StyledCardProps {
  imageComponent?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardWithImage = forwardRef<YStack, CardWithImageProps>(
  ({ imageComponent, children, ...props }, ref) => {
    return (
      <CardWithImageContainer ref={ref as any} {...props}>
        {imageComponent}
        <YStack padding="$4">{children}</YStack>
      </CardWithImageContainer>
    );
  }
);

CardWithImage.displayName = "CardWithImage";
