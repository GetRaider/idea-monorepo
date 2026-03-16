"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
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
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  trigger,
  onOpenChange,
  className,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  const updateOpen = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
    if (!next) setMenuRect(null);
  };

  useEffect(() => {
    if (!isOpen || !trigger || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.right,
      minWidth: rect.width,
    });
  }, [isOpen, trigger]);

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
  }, [onOpenChange]);

  return (
    <>
      <DropdownWrapper ref={wrapperRef} className={className}>
        {trigger ? (
          <TriggerWrapper onClick={() => updateOpen(!isOpen)}>
            {trigger}
          </TriggerWrapper>
        ) : (
          <DropdownTrigger onClick={() => updateOpen(!isOpen)}>
            {selectedLabel}
            <ChevronIcon $open={isOpen}>▼</ChevronIcon>
          </DropdownTrigger>
        )}
      </DropdownWrapper>
      {isOpen &&
        (trigger && menuRect
          ? createPortal(
              <DropdownMenu
                ref={menuRef}
                $portal
                style={{
                  top: menuRect.top,
                  left: menuRect.left,
                  transform: "translateX(-100%)",
                  minWidth: menuRect.minWidth,
                }}
              >
                {options.map((option) => (
                  <DropdownItem
                    key={option.value}
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
            )
          : !trigger && (
              <DropdownMenu>
                {options.map((option) => (
                  <DropdownItem
                    key={option.value}
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
              </DropdownMenu>
            ))}
    </>
  );
}
