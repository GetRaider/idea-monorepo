"use client";

import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/cn";
import type { UiProps } from "../../lib/ui-props";

function CloseIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DialogCloseButton({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-[28px] leading-none text-zinc-400 transition-all duration-200 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-transparent hover:disabled:text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}

export function DialogOverlay({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 p-5 backdrop-blur-md sm:p-5 max-[600px]:p-2.5",
        className,
      )}
      {...props}
    />
  );
}

type DialogContainerProps = UiProps<"div"> & {
  maxWidth?: number;
  minHeight?: number;
};

export function DialogContainer({
  className,
  style,
  ref,
  maxWidth = 500,
  minHeight,
  ...props
}: DialogContainerProps) {
  return (
    <div
      ref={ref}
      style={{
        ...style,
        maxWidth,
        ...(minHeight !== undefined ? { minHeight } : {}),
      }}
      className={cn(
        "flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl max-[600px]:max-h-[95vh] max-[600px]:rounded-lg",
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-6 flex items-start justify-between gap-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn("m-0 text-xl font-semibold text-white", className)}
      {...props}
    />
  );
}

export function DialogSubtitle({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 mt-1 text-sm leading-normal text-zinc-400", className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col", className)}
      {...props}
    />
  );
}

export function DialogActions({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  );
}

export function ConfirmBody({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn(
        "mx-0 mt-0 mb-6 text-sm leading-normal text-slate-300",
        className,
      )}
      {...props}
    />
  );
}

export function ConfirmActions({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex justify-end gap-3", className)}
      {...props}
    />
  );
}

export function ConfirmCancelBtn({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "cursor-pointer rounded-lg border border-zinc-600 bg-transparent px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 hover:disabled:bg-transparent hover:disabled:text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}

export function ConfirmDangerBtn({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
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

export function Dialog({
  title,
  subtitle,
  onClose,
  children,
  showCloseButton = true,
  maxWidth = 500,
  minHeight,
}: DialogProps) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const focusSelectors = useMemo(
    () =>
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    [],
  );

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
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
        onCloseRef.current();
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

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
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
  }, [focusSelectors]);

  const dialogTree = (
    <DialogOverlay onClick={handleOverlayClick}>
      <DialogContainer
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        maxWidth={maxWidth}
        minHeight={minHeight}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
      >
        <DialogHeader>
          <div className="min-w-0 flex-1">
            <DialogTitle id={titleId}>{title}</DialogTitle>
            {subtitle && (
              <DialogSubtitle id={subtitleId}>{subtitle}</DialogSubtitle>
            )}
          </div>
          {showCloseButton && (
            <DialogCloseButton onClick={onClose}>
              <CloseIcon />
            </DialogCloseButton>
          )}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContainer>
    </DialogOverlay>
  );

  if (typeof document === "undefined") return null;

  return createPortal(dialogTree, document.body);
}

interface DialogProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
  minHeight?: number;
}
