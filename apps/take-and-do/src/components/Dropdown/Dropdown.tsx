"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/styles/utils";

export function DropdownChevron({
  open,
  className,
  children = "▼",
}: {
  open: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-[10px] text-text-secondary transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface DropdownOption<T extends string = string> {
  label: string;
  value: T;
  danger?: boolean;
}

interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  trigger?: ReactNode;
  disabled?: boolean;
  /**
   * With a custom `trigger`: `left` keeps the menu’s right edge aligned with the
   * trigger’s right edge (extends left). `right` places the menu’s left edge at the
   * trigger’s right edge (extends right) — use for triggers on the viewport’s left edge.
   */
  menuOpensTo?: "left" | "right";
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
  menuMinWidth?: number;
  fullWidth?: boolean;
  id?: string;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  trigger,
  disabled = false,
  menuOpensTo = "left",
  onOpenChange,
  className,
  menuMinWidth,
  fullWidth = false,
  id,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{
    left: number;
    minWidth: number;
    transform: string;
    vertical: "below" | "above";
    top?: number;
    bottom?: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  const updateOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
      if (!next) setMenuRect(null);
    },
    [onOpenChange],
  );

  const measureMenu = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const minWidth =
      menuMinWidth !== undefined
        ? Math.max(rect.width, menuMinWidth)
        : rect.width;
    const gap = 4;
    const estimatedMenuHeight = Math.min(
      options.length * 44 + 16,
      window.innerHeight * 0.55,
    );
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    let vertical: "below" | "above";
    if (spaceBelow >= estimatedMenuHeight) {
      vertical = "below";
    } else if (spaceAbove >= estimatedMenuHeight) {
      vertical = "above";
    } else {
      vertical = spaceAbove > spaceBelow ? "above" : "below";
    }

    const horizontal = (() => {
      if (!trigger) {
        return { left: rect.left, transform: "none" as const };
      }
      if (menuOpensTo === "right") {
        return { left: rect.right + gap, transform: "none" as const };
      }
      return { left: rect.right, transform: "translateX(-100%)" as const };
    })();

    if (vertical === "below") {
      setMenuRect({
        vertical: "below",
        top: rect.bottom + gap,
        left: horizontal.left,
        minWidth,
        transform: horizontal.transform,
      });
    } else {
      setMenuRect({
        vertical: "above",
        bottom: window.innerHeight - rect.top + gap,
        left: horizontal.left,
        minWidth,
        transform: horizontal.transform,
      });
    }
  }, [trigger, menuMinWidth, menuOpensTo, options.length]);

  useEffect(() => {
    if (disabled) {
      updateOpen(false);
    }
  }, [disabled, updateOpen]);

  useEffect(() => {
    if (!isOpen) return;
    measureMenu();
    window.addEventListener("scroll", measureMenu, true);
    window.addEventListener("resize", measureMenu);
    return () => {
      window.removeEventListener("scroll", measureMenu, true);
      window.removeEventListener("resize", measureMenu);
    };
  }, [isOpen, measureMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      updateOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [updateOpen]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn(
          "relative",
          fullWidth ? "block w-full" : "inline-block w-auto",
          className,
        )}
      >
        {trigger ? (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex cursor-pointer items-center border-0 bg-transparent p-0",
              disabled && "cursor-not-allowed opacity-60",
            )}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => !disabled && updateOpen(!isOpen)}
          >
            {trigger}
          </button>
        ) : (
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-input-border bg-input-bg px-3 py-1.5 text-sm text-white transition-[border-color] duration-200 hover:border-input-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              fullWidth ? "w-full justify-between" : "w-auto justify-start",
              disabled &&
                "cursor-not-allowed opacity-60 hover:border-input-border",
            )}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => !disabled && updateOpen(!isOpen)}
          >
            {selectedLabel}
            <DropdownChevron open={isOpen} />
          </button>
        )}
      </div>
      {isOpen &&
        menuRect &&
        createPortal(
          <ul
            ref={menuRef}
            data-dropdown-portal
            className="fixed z-[1100] m-0 flex max-h-[60vh] w-max list-none flex-col gap-0.5 overflow-y-auto rounded-md border border-input-border bg-input-bg p-1 shadow-dropdown [-webkit-overflow-scrolling:touch]"
            style={{
              ...(menuRect.vertical === "below"
                ? { top: menuRect.top }
                : { top: "auto", bottom: menuRect.bottom }),
              left: menuRect.left,
              transform: menuRect.transform,
              minWidth: menuRect.minWidth,
            }}
          >
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={cn(
                  "w-full cursor-pointer whitespace-nowrap rounded px-3 py-2 text-left text-sm transition-[background,color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60",
                  option.value === value
                    ? option.danger
                      ? "bg-[#3a3a3a] text-red-500"
                      : "bg-[#3a3a3a] text-white"
                    : option.danger
                      ? "bg-transparent text-red-500 hover:bg-[#3a3a3a] hover:text-red-300"
                      : "bg-transparent text-[#aaa] hover:bg-[#3a3a3a] hover:text-white",
                )}
                onClick={() => {
                  onChange(option.value);
                  updateOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
