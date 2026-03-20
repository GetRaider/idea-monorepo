"use client";

import { ReactNode, useEffect, useId, useMemo, useRef } from "react";

import { CloseIcon } from "@/components/Icons";
import { CloseButton } from "@/components/Buttons";
import {
  DialogContainer,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "./Dialog.styles";

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
          !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
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
          !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
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
