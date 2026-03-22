"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

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
  onOpenChange,
  className,
  menuMinWidth,
  fullWidth = false,
  id,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    minWidth: number;
    transform: string;
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
    if (trigger) {
      setMenuRect({
        top: rect.bottom + 4,
        left: rect.right,
        minWidth,
        transform: "translateX(-100%)",
      });
    } else {
      setMenuRect({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth,
        transform: "none",
      });
    }
  }, [trigger, menuMinWidth]);

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
            className="inline-flex cursor-pointer items-center border-0 bg-transparent p-0"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => updateOpen(!isOpen)}
          >
            {trigger}
          </button>
        ) : (
          <button
            type="button"
            id={id}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-input-border bg-input-bg px-3 py-1.5 text-sm text-white transition-[border-color] duration-200 hover:border-input-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              fullWidth ? "w-full justify-between" : "w-auto justify-start",
            )}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => updateOpen(!isOpen)}
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
              top: menuRect.top,
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
