import { forwardRef } from "react";
import {
  Sheet as TamaguiSheet,
  styled,
  YStack,
  XStack,
  GetProps,
  useTheme,
} from "tamagui";
import { shadows } from "../primitives/shadows";

// Sheet Handle
const SheetHandle = styled(XStack, {
  name: "SheetHandle",
  width: 40,
  height: 5,
  backgroundColor: "$gray300",
  borderRadius: "$10",
  alignSelf: "center",
  marginTop: "$3",
  marginBottom: "$2",
});

// Sheet Overlay
const SheetOverlay = styled(TamaguiSheet.Overlay, {
  name: "SheetOverlay",
  animation: "fast",
  opacity: 0.5,
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
});

// Sheet Frame (content container)
const SheetFrame = styled(TamaguiSheet.Frame, {
  name: "SheetFrame",
  backgroundColor: "$background",
  borderTopLeftRadius: "$7",
  borderTopRightRadius: "$7",
  padding: "$4",
  paddingTop: 0,
  ...shadows.modal,
});

// Sheet Header
export const SheetHeader = styled(YStack, {
  name: "SheetHeader",
  paddingBottom: "$3",
  borderBottomWidth: 1,
  borderBottomColor: "$borderColor",
  marginBottom: "$3",
  gap: "$1",
});

// Sheet Content
export const SheetContent = styled(YStack, {
  name: "SheetContent",
  flex: 1,
});

// Sheet Footer
export const SheetFooter = styled(XStack, {
  name: "SheetFooter",
  paddingTop: "$3",
  borderTopWidth: 1,
  borderTopColor: "$borderColor",
  marginTop: "$3",
  gap: "$3",
  justifyContent: "flex-end",
});

// Main Sheet component props
export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: number[];
  snapPointsMode?: "percent" | "constant" | "fit" | "mixed";
  position?: number;
  onPositionChange?: (position: number) => void;
  dismissOnSnapToBottom?: boolean;
  dismissOnOverlayPress?: boolean;
  children?: React.ReactNode;
  modal?: boolean;
  zIndex?: number;
}

export const Sheet = forwardRef<typeof TamaguiSheet, SheetProps>(
  (
    {
      open,
      onOpenChange,
      snapPoints = [85, 50, 25],
      snapPointsMode = "percent",
      position,
      onPositionChange,
      dismissOnSnapToBottom = true,
      dismissOnOverlayPress = true,
      children,
      modal = true,
      zIndex = 100000,
    },
    ref
  ) => {
    const theme = useTheme();

    return (
      <TamaguiSheet
        ref={ref as any}
        forceRemoveScrollEnabled={open}
        modal={modal}
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        snapPointsMode={snapPointsMode}
        position={position}
        onPositionChange={onPositionChange}
        dismissOnSnapToBottom={dismissOnSnapToBottom}
        dismissOnOverlayPress={dismissOnOverlayPress}
        zIndex={zIndex}
        animation="medium"
      >
        <SheetOverlay
          backgroundColor={theme.shadowColor?.val || "rgba(0,0,0,0.5)"}
        />
        <SheetFrame>
          <SheetHandle />
          {children}
        </SheetFrame>
      </TamaguiSheet>
    );
  }
);

Sheet.displayName = "Sheet";

// Compound exports
export { SheetHandle, SheetOverlay, SheetFrame };

// Re-export Tamagui Sheet for advanced usage
export { TamaguiSheet };
