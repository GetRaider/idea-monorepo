"use client";

import { useState } from "react";

import { ChevronDownIcon } from "@/components/Icons";
import { FOCUS_SESSION_COLORS } from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

export function FocusColourPicker({
  value,
  onChange,
  defaultExpanded = false,
}: FocusColourPickerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-left text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ChevronDownIcon
          size={14}
          className={cn(
            "shrink-0 transition-transform",
            expanded ? "rotate-180" : "rotate-0",
          )}
        />
        Colour
        <span
          className="ml-1 inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="grid grid-cols-6 gap-2">
          {FOCUS_SESSION_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Select colour ${color}`}
              aria-pressed={value === color}
              onClick={() => onChange(color)}
              className={cn(
                "aspect-square rounded-md border-2 transition-transform hover:scale-105",
                value === color
                  ? "border-white"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FocusColourPickerProps {
  value: string;
  onChange: (color: string) => void;
  defaultExpanded?: boolean;
}
