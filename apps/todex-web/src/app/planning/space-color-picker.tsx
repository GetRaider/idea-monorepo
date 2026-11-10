"use client";

import { SPACE_COLORS, type SpaceColor } from "@repo/api/todex";
import { cn } from "@repo/ui";

export function SpaceColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: SpaceColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Color">
      {SPACE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="option"
          aria-selected={value === color}
          aria-label={color}
          className={cn(
            "h-6 w-6 rounded-full bg-[var(--todex-swatch)]",
            value === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
          style={{ ["--todex-swatch" as string]: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
