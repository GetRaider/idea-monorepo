"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

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
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  const updateOpen = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        updateOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  return (
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
      {isOpen && (
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
      )}
    </DropdownWrapper>
  );
}
