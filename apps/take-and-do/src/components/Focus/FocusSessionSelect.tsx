"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { DropdownChevron } from "@/components/Dropdown/Dropdown";
import { cn } from "@/lib/styles/utils";
import {
  dropdownMenuItemTransitionClass,
  dropdownPanelClass,
  dropdownTriggerTransitionClass,
} from "@/lib/styles/dropdown-classes";

export function FocusSessionSelect({
  options,
  value,
  onChange,
  placeholder = "Select session",
  size = "default",
  disabled = false,
  className,
}: FocusSessionSelectProps) {
  const isCompact = size === "compact";
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    minWidth: number;
    transform: string;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? null;
  const selectedLabel = selectedOption?.label ?? placeholder;

  const measureMenu = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
      transform: "none",
    });
  }, []);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

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
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn(
          "relative",
          isCompact ? "w-auto min-w-[10rem]" : "w-full max-w-xs",
          className,
        )}
      >
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex w-full items-center gap-2 whitespace-nowrap rounded-md border border-input-border bg-input-bg text-left font-semibold text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            dropdownTriggerTransitionClass,
            isCompact
              ? "min-h-8 px-3 py-1.5 text-xs leading-none"
              : "min-h-10 px-5 py-2.5 text-sm",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-input-border-hover",
          )}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => {
            if (disabled) return;
            setIsOpen((previous) => !previous);
          }}
        >
          {selectedOption?.color ? (
            <FocusSessionColorSwatch color={selectedOption.color} />
          ) : null}
          <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
          <DropdownChevron open={isOpen} />
        </button>
      </div>

      {isOpen && menuRect
        ? createPortal(
            <ul
              ref={menuRef}
              data-dropdown-portal
              className={cn(
                "fixed z-[5200] m-0 flex max-h-[60vh] w-max origin-top list-none flex-col gap-0.5 overflow-y-auto rounded-md border border-input-border bg-background-primary p-1 shadow-dropdown [-webkit-overflow-scrolling:touch]",
                dropdownPanelClass,
              )}
              style={{
                top: menuRect.top,
                left: menuRect.left,
                minWidth: menuRect.minWidth,
                transform: menuRect.transform,
              }}
            >
              {options.map((option) => (
                <li key={option.value || "all-sessions"}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded px-3 py-2.5 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                      dropdownMenuItemTransitionClass,
                      option.value === value
                        ? "bg-zinc-700 text-text-primary"
                        : "bg-transparent text-text-secondary hover:bg-zinc-700 hover:text-text-primary",
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.color ? (
                      <FocusSessionColorSwatch color={option.color} />
                    ) : (
                      <span className="h-3 w-3 shrink-0" aria-hidden />
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}

function FocusSessionColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-sm border border-white/20"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export interface FocusSessionSelectOption {
  value: string;
  label: string;
  color: string | null;
}

interface FocusSessionSelectProps {
  options: FocusSessionSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "default" | "compact";
  disabled?: boolean;
  className?: string;
}
