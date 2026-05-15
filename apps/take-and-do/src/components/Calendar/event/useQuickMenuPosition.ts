import type { RefObject } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

type Anchor = { clientX: number; clientY: number };

export interface UseQuickMenuPositionParams {
  scopeRef: RefObject<HTMLElement | null>;
  anchor: Anchor;
  anchorRect?: DOMRect;
  pad?: number;
}

export function useQuickMenuPosition({
  scopeRef,
  anchor,
  anchorRect,
  pad: padArg,
}: UseQuickMenuPositionParams): {
  panelRef: RefObject<HTMLDivElement | null>;
  pos: { left: number; top: number; width: number } | null;
  desiredWidth: number;
} {
  const pad = padArg ?? 12;
  const panelRef = useRef<HTMLDivElement | null>(null);

  const desiredWidth = useMemo(() => {
    if (typeof window === "undefined") return 380;
    const scopeWidth = scopeRef.current?.getBoundingClientRect().width;
    const max = 360;
    const min = 300;
    const base =
      typeof scopeWidth === "number" ? scopeWidth : window.innerWidth;
    return Math.min(max, Math.max(min, base - pad * 2));
  }, [scopeRef, pad]);

  const [pos, setPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || typeof window === "undefined") return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const scopeRect =
        scopeRef.current?.getBoundingClientRect() ??
        ({
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          right: window.innerWidth,
          bottom: window.innerHeight,
        } as DOMRect);

      const w = Math.min(desiredWidth, scopeRect.width - pad * 2);
      const h = rect.height || 520;

      const anchorX =
        (anchorRect
          ? (anchorRect.left + anchorRect.right) / 2
          : anchor.clientX) - scopeRect.left;
      const anchorY =
        (anchorRect
          ? (anchorRect.top + anchorRect.bottom) / 2
          : anchor.clientY) - scopeRect.top;

      const rightEdge = anchorRect
        ? anchorRect.right - scopeRect.left
        : anchorX;
      const leftEdge = anchorRect ? anchorRect.left - scopeRect.left : anchorX;
      const spaceRight = scopeRect.width - rightEdge;
      const spaceLeft = leftEdge;
      const wantsRight = spaceRight >= w + pad * 2 || spaceRight >= spaceLeft;
      const left = wantsRight
        ? Math.max(pad, Math.min(rightEdge + pad, scopeRect.width - w - pad))
        : Math.max(
            pad,
            Math.min(leftEdge - w - pad, scopeRect.width - w - pad),
          );

      const below =
        (anchorRect ? anchorRect.bottom - scopeRect.top : anchorY) + pad;
      const above =
        (anchorRect ? anchorRect.top - scopeRect.top : anchorY) - h - pad;
      const canFitBelow = below + h + pad <= scopeRect.height;
      const canFitAbove = above >= pad;

      const top = (() => {
        if (scopeRect.height < 480 || scopeRect.width < 380) return pad;
        if (canFitBelow) return below;
        if (canFitAbove) return above;
        return Math.max(pad, Math.min(below, scopeRect.height - h - pad));
      })();

      setPos({ left, top, width: w });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchor.clientX, anchor.clientY, anchorRect, desiredWidth, scopeRef, pad]);

  return { panelRef, pos, desiredWidth };
}
