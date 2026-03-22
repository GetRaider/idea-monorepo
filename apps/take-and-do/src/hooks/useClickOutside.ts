import { useEffect, type RefObject } from "react";

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!isActive) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      onOutside();
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ref, isActive, onOutside]);
}
