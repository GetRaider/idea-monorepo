"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  ChevronIcon,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  DropdownWrapper,
  TriggerWrapper,
} from "./Dropdown.styles";

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
    options.find((o) => o.value === value)?.label ?? placeholder;

  const updateOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
      if (!next) setMenuRect(null);
    },
    [onOpenChange],
  );

  const measureMenu = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
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
      <DropdownWrapper
        ref={wrapperRef}
        className={className}
        $fullWidth={fullWidth}
      >
        {trigger ? (
          <TriggerWrapper
            type="button"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => updateOpen(!isOpen)}
          >
            {trigger}
          </TriggerWrapper>
        ) : (
          <DropdownTrigger
            type="button"
            id={id}
            $fullWidth={fullWidth}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => updateOpen(!isOpen)}
          >
            {selectedLabel}
            <ChevronIcon $open={isOpen}>▼</ChevronIcon>
          </DropdownTrigger>
        )}
      </DropdownWrapper>
      {isOpen &&
        menuRect &&
        createPortal(
          <DropdownMenu
            ref={menuRef}
            $portal
            data-dropdown-portal
            style={{
              top: menuRect.top,
              left: menuRect.left,
              transform: menuRect.transform,
              minWidth: menuRect.minWidth,
            }}
          >
            {options.map((option) => (
              <DropdownItem
                key={String(option.value)}
                $active={option.value === value}
                $danger={option.danger}
                onClick={() => {
                  onChange(option.value);
                  updateOpen(false);
                }}
              >
                {option.label}
              </DropdownItem>
            ))}
          </DropdownMenu>,
          document.body,
        )}
    </>
  );
}
