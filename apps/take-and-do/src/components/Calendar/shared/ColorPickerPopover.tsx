"use client";

import type { ChangeEvent, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

import { cn } from "@/lib/styles/utils";

import {
  CALENDAR_PRESET_HEXES,
  coerceHexToWhiteTextSafe,
  hexIsReadableWithWhiteText,
  normalizeHexColor,
} from "@/helpers/calendar/calendar-colors";

export interface CalendarColorPickerPopoverProps {
  selectedHex: string;
  onSelect: (hex: string) => void;
  /** Clears override (e.g. event type → built-in default). */
  onResetToDefault?: () => void;
  trigger: ReactNode;
  /** Menu opens with its right edge at trigger (panel sits on the left). */
  menuOpensTo?: "left" | "right";
  align?: "below" | "auto";
}

export function CalendarColorPickerPopover({
  selectedHex,
  onSelect,
  onResetToDefault,
  trigger,
  menuOpensTo = "left",
  align = "auto",
}: CalendarColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    transform: string;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const normalizedSelected = normalizeHexColor(selectedHex) ?? selectedHex;

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const estH = 200;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const vertical =
      align === "below"
        ? "below"
        : spaceBelow >= estH || spaceBelow >= spaceAbove
          ? "below"
          : "above";

    const horizontal = (() => {
      if (menuOpensTo === "right") {
        return { left: rect.right + gap, transform: "none" as const };
      }
      return { left: rect.right, transform: "translateX(-100%)" as const };
    })();

    if (vertical === "below") {
      setMenuPos({
        top: rect.bottom + gap,
        left: horizontal.left,
        transform: horizontal.transform,
      });
    } else {
      setMenuPos({
        bottom: window.innerHeight - rect.top + gap,
        left: horizontal.left,
        transform: horizontal.transform,
      });
    }
  }, [align, menuOpensTo]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (hex: string) => {
    const n = normalizeHexColor(hex);
    if (n) onSelect(coerceHexToWhiteTextSafe(n));
    setOpen(false);
  };

  const onCustomPicked = (ev: ChangeEvent<HTMLInputElement>) => {
    const raw = ev.target.value;
    const n = normalizeHexColor(raw);
    if (n) onSelect(coerceHexToWhiteTextSafe(n));
    setOpen(false);
    ev.target.value = "";
  };

  return (
    <>
      <div ref={wrapRef} className="relative inline-flex shrink-0">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Choose color"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {trigger}
        </button>
      </div>
      <input
        ref={fileRef}
        type="color"
        className="pointer-events-none fixed left-0 top-0 h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
        onChange={onCustomPicked}
      />
      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="dialog"
              aria-label="Color"
              data-calendar-color-menu
              className="fixed z-[5400] w-[200px] rounded-xl border border-white/[0.1] bg-gradient-to-b from-[rgba(40,38,52,0.98)] to-[rgba(22,20,32,0.99)] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md"
              style={{
                ...(menuPos.top != null
                  ? { top: menuPos.top }
                  : { top: "auto", bottom: menuPos.bottom }),
                left: menuPos.left,
                transform: menuPos.transform,
              }}
            >
              <div className="grid grid-cols-6 gap-2">
                {CALENDAR_PRESET_HEXES.map((hex) => {
                  const active = hex === normalizedSelected;
                  return (
                    <button
                      key={hex}
                      type="button"
                      title={hex}
                      className={cn(
                        "relative flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.12] shadow-inner transition-transform hover:scale-105",
                        active &&
                          "ring-2 ring-white/70 ring-offset-2 ring-offset-[rgba(22,20,32,0.99)]",
                      )}
                      style={{ backgroundColor: hex }}
                      onClick={() => pick(hex)}
                    >
                      {active ? (
                        <Check
                          size={14}
                          className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
                          strokeWidth={2.5}
                          color={
                            hexIsReadableWithWhiteText(hex) ? "#fff" : "#111"
                          }
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-2.5">
                {onResetToDefault ? (
                  <button
                    type="button"
                    className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                    onClick={() => {
                      onResetToDefault();
                      setOpen(false);
                    }}
                  >
                    Default
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-white/25 bg-white/[0.06] text-zinc-300 transition-colors hover:border-white/40 hover:bg-white/[0.1] hover:text-white"
                  title="Custom color"
                  aria-label="Custom color"
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="text-lg font-light leading-none">+</span>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
