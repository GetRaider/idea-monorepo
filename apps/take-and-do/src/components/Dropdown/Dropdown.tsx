"use client";

import { useEffect, useRef, useState } from "react";

import {
  ChevronIcon,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  DropdownWrapper,
} from "./Dropdown.styles";

export interface DropdownOption<T extends string = string> {
  label: string;
  value: T;
}

interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownWrapper ref={wrapperRef}>
      <DropdownTrigger onClick={() => setIsOpen((prev) => !prev)}>
        {selectedLabel}
        <ChevronIcon $open={isOpen}>▼</ChevronIcon>
      </DropdownTrigger>
      {isOpen && (
        <DropdownMenu>
          {options.map((option) => (
            <DropdownItem
              key={option.value}
              $active={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
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
