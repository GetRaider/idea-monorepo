"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { DropdownOption } from "@/components/Dropdown";
import { DropdownChevron } from "@/components/Dropdown/Dropdown";
import {
  SelectableListTitle,
  SelectAllRow,
  TaskCheckbox,
  TaskLabel,
  TaskSelectionHeader,
  TaskSelectionSection,
} from "@/components/SelectableList";

import { cn } from "@/lib/utils";

export function DropdownMultiSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  emptyMessage = "No options",
  listTitle = "Select items",
  menuMinWidth = 320,
  id,
  className,
  onOpenChange,
}: DropdownMultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedSet = new Set(value);

  const triggerText = (() => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const label = options.find((option) => option.value === value[0])?.label;
      return label ?? placeholder;
    }
    return `${value.length} selected`;
  })();

  const updateOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
      if (!next) setPanelRect(null);
    },
    [onOpenChange],
  );

  const measurePanel = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPanelRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, menuMinWidth),
    });
  }, [menuMinWidth]);

  useEffect(() => {
    if (!isOpen) return;
    measurePanel();
    window.addEventListener("scroll", measurePanel, true);
    window.addEventListener("resize", measurePanel);
    return () => {
      window.removeEventListener("scroll", measurePanel, true);
      window.removeEventListener("resize", measurePanel);
    };
  }, [isOpen, measurePanel]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return;
      updateOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, updateOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") updateOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, updateOpen]);

  const toggle = (optionValue: T) => {
    if (selectedSet.has(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const allSelected =
    options.length > 0 &&
    options.every((option) => selectedSet.has(option.value));

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };

  return (
    <>
      <div ref={wrapperRef} className={cn("relative block w-full", className)}>
        <button
          type="button"
          id={id}
          className="flex w-full cursor-pointer items-center justify-between gap-1.5 whitespace-nowrap rounded-md border border-input-border bg-input-bg px-3 py-1.5 text-sm text-white transition-[border-color] duration-200 hover:border-input-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => updateOpen(!isOpen)}
        >
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis text-left">
            {triggerText}
          </span>
          <DropdownChevron open={isOpen} />
        </button>
      </div>
      {isOpen &&
        panelRect &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable="true"
            className="fixed z-[1100] box-border rounded-lg border border-input-border bg-input-bg p-3 shadow-dropdown"
            style={{
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
            }}
          >
            <TaskSelectionHeader>
              <SelectableListTitle>{listTitle}</SelectableListTitle>
              {options.length > 0 && (
                <SelectAllRow type="button" onClick={toggleAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </SelectAllRow>
              )}
            </TaskSelectionHeader>
            <TaskSelectionSection>
              {options.length === 0 ? (
                <p className="m-0 px-1 py-2 text-sm text-slate-400">
                  {emptyMessage}
                </p>
              ) : (
                options.map((option) => {
                  const checked = selectedSet.has(option.value);
                  return (
                    <TaskLabel key={option.value}>
                      <TaskCheckbox
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(option.value)}
                      />
                      <span>{option.label}</span>
                    </TaskLabel>
                  );
                })
              )}
            </TaskSelectionSection>
          </div>,
          document.body,
        )}
    </>
  );
}

interface DropdownMultiSelectProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  listTitle?: string;
  menuMinWidth?: number;
  id?: string;
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
}
