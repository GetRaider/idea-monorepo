"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/styles/utils";

type ListRowAnchorMenuProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onRequestClose: () => void;
  children: ReactNode;
  /** Gap between trigger bottom and menu top (px). */
  gap?: number;
  className?: string;
};

export function ListRowAnchorMenu({
  open,
  anchorRef,
  onRequestClose,
  children,
  gap = 6,
  className,
}: ListRowAnchorMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    setStyle({
      position: "fixed",
      left: rect.left,
      minWidth: Math.max(180, rect.width),
      zIndex: 1100,
      ...(placeAbove
        ? {
            top: "auto",
            bottom: window.innerHeight - rect.top + gap,
          }
        : {
            top: rect.bottom + gap,
            bottom: "auto",
          }),
    });
  }, [anchorRef, gap]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    updatePosition();
    const el = anchorRef.current;
    const ro = el ? new ResizeObserver(updatePosition) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      onRequestClose();
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, anchorRef, onRequestClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onRequestClose]);

  if (!open || !style) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        "max-h-[min(60vh,520px)] overflow-y-auto rounded-xl border border-white/10 bg-background-primary py-0.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] [-webkit-overflow-scrolling:touch]",
        className,
      )}
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}
