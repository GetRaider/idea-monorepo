import type { CSSProperties } from "react";

import { SESSION_COLORS } from "../../../shared/session-colors";

import { cn } from "../lib/cn";

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm text-tempo-muted">
        Colour
        <span
          className="h-3 w-3 rounded-full bg-[var(--picker-preview)]"
          style={{ "--picker-preview": value } as CSSProperties}
          aria-hidden
        />
      </span>
      <div className="flex flex-wrap gap-2">
        {SESSION_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Select colour ${color}`}
            aria-pressed={value === color}
            className={cn(
              "h-7 w-7 rounded-full border-2 bg-[var(--picker-swatch)]",
              value === color ? "border-tempo-text" : "border-transparent",
            )}
            style={{ "--picker-swatch": color } as CSSProperties}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}
