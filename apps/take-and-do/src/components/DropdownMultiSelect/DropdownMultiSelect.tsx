"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { DropdownOption } from "@/components/Dropdown";
import { ChevronIcon } from "@/components/Dropdown/Dropdown.styles";
import {
  SelectableListTitle,
  SelectAllRow,
  TaskCheckbox,
  TaskLabel,
  TaskSelectionHeader,
  TaskSelectionSection,
} from "@/components/SelectableList";

import {
  EmptyHintText,
  MultiSelectTrigger,
  MultiSelectWrapper,
  PortalPanel,
  TriggerLabel,
} from "./DropdownMultiSelect.styles";

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
      const label = options.find((o) => o.value === value[0])?.label;
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
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return;
      updateOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [updateOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") updateOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, updateOpen]);

  const toggle = (optionValue: T) => {
    if (selectedSet.has(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const allSelected =
    options.length > 0 && options.every((o) => selectedSet.has(o.value));

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  return (
    <>
      <MultiSelectWrapper ref={wrapperRef} className={className}>
        <MultiSelectTrigger
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => updateOpen(!isOpen)}
        >
          <TriggerLabel>{triggerText}</TriggerLabel>
          <ChevronIcon $open={isOpen}>▼</ChevronIcon>
        </MultiSelectTrigger>
      </MultiSelectWrapper>
      {isOpen &&
        panelRect &&
        createPortal(
          <PortalPanel
            ref={panelRef}
            role="listbox"
            aria-multiselectable="true"
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
                <EmptyHintText>{emptyMessage}</EmptyHintText>
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
          </PortalPanel>,
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
