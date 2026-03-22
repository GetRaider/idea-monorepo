"use client";

import type { ComponentProps } from "react";
import { ReactNode, useEffect, useId, useMemo, useRef } from "react";

import { CloseIcon } from "@/components/Icons";
import { CloseButton } from "@/components/Buttons";
import { cn } from "@/lib/utils";

type DialogOverlayProps = ComponentProps<"div">;

export function DialogOverlay({
  className,
  ref,
  ...props
}: DialogOverlayProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-[4000] flex items-center justify-center bg-black/30 p-5 backdrop-blur-sm sm:p-5 max-[600px]:p-2.5",
        className,
      )}
      {...props}
    />
  );
}

type DialogContainerProps = ComponentProps<"div"> & {
  $maxWidth?: number;
  $minHeight?: number;
};

export function DialogContainer({
  className,
  style,
  ref,
  $maxWidth = 500,
  $minHeight,
  ...props
}: DialogContainerProps) {
  return (
    <div
      ref={ref}
      style={{
        ...style,
        maxWidth: $maxWidth,
        ...($minHeight !== undefined ? { minHeight: $minHeight } : {}),
      }}
      className={cn(
        "flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-xl border border-border-app bg-card-bg p-6 shadow-dialog max-[600px]:max-h-[95vh] max-[600px]:rounded-lg",
        className,
      )}
      {...props}
    />
  );
}

type DialogHeaderProps = ComponentProps<"div">;

export function DialogHeader({ className, ref, ...props }: DialogHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-6 flex items-center justify-between", className)}
      {...props}
    />
  );
}

type DialogTitleProps = ComponentProps<"h2">;

export function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
  return (
    <h2
      ref={ref}
      className={cn("m-0 text-xl font-semibold text-white", className)}
      {...props}
    />
  );
}

type DialogBodyProps = ComponentProps<"div">;

export function DialogBody({ className, ref, ...props }: DialogBodyProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col", className)}
      {...props}
    />
  );
}

type DialogActionsProps = ComponentProps<"div">;

export function DialogActions({
  className,
  ref,
  ...props
}: DialogActionsProps) {
  return (
    <div
      ref={ref}
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  );
}

type ConfirmBodyProps = ComponentProps<"p">;

export function ConfirmBody({ className, ref, ...props }: ConfirmBodyProps) {
  return (
    <p
      ref={ref}
      className={cn(
        "mb-6 m-0 text-sm leading-normal text-slate-300",
        className,
      )}
      {...props}
    />
  );
}

type ConfirmActionsProps = ComponentProps<"div">;

export function ConfirmActions({
  className,
  ref,
  ...props
}: ConfirmActionsProps) {
  return (
    <div
      ref={ref}
      className={cn("flex justify-end gap-3", className)}
      {...props}
    />
  );
}

type ConfirmCancelBtnProps = ComponentProps<"button">;

export function ConfirmCancelBtn({
  className,
  type = "button",
  ref,
  ...props
}: ConfirmCancelBtnProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "cursor-pointer rounded-lg border border-border-app bg-transparent px-5 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60 hover:disabled:bg-transparent hover:disabled:text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

type ConfirmDangerBtnProps = ComponentProps<"button">;

export function ConfirmDangerBtn({
  className,
  type = "button",
  ref,
  ...props
}: ConfirmDangerBtnProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "cursor-pointer rounded-lg border-0 bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 hover:disabled:bg-red-500",
        className,
      )}
      {...props}
    />
  );
}

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
  minHeight?: number;
}

export function Dialog({
  title,
  onClose,
  children,
  showCloseButton = true,
  maxWidth = 500,
  minHeight,
}: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusSelectors = useMemo(
    () =>
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    [],
  );

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const prevFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const focusables = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(focusSelectors),
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.getAttribute("aria-hidden") !== "true",
      );

      (focusables[0] ?? dialogEl).focus?.();
    };

    focusFirst();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(focusSelectors),
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.getAttribute("aria-hidden") !== "true",
      );

      if (focusables.length === 0) {
        e.preventDefault();
        root.focus?.();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      prevFocused?.focus?.();
    };
  }, [focusSelectors, onClose]);

  return (
    <DialogOverlay onClick={handleOverlayClick}>
      <DialogContainer
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        $maxWidth={maxWidth}
        $minHeight={minHeight}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          {showCloseButton && (
            <CloseButton onClick={onClose}>
              <CloseIcon />
            </CloseButton>
          )}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContainer>
    </DialogOverlay>
  );
}
