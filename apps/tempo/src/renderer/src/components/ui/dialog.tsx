import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export function Dialog({
  open,
  onOpenChange,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogContent({
  className,
  overlayDismiss = false,
  children,
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-tempo-line bg-[#101114] p-5 text-tempo-text shadow-xl",
          className,
        )}
        onPointerDownOutside={
          overlayDismiss
            ? undefined
            : (event) => {
                event.preventDefault();
              }
        }
        onInteractOutside={
          overlayDismiss
            ? undefined
            : (event) => {
                event.preventDefault();
              }
        }
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: DialogPrimitive.DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("m-0 text-lg font-medium", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-2 text-sm text-tempo-muted", className)}
      {...props}
    />
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  className?: string;
  overlayDismiss?: boolean;
  children: ReactNode;
}
