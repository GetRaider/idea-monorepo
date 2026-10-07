"use client";

import type { CSSProperties } from "react";
import { Popover, PopoverContent, PopoverTrigger, cn } from "@repo/ui";

import { CALENDAR_EVENT_COLORS } from "./calendar-colors";

export function CalendarColorPicker({
  color,
  disabled,
  onChange,
}: {
  color: string;
  disabled?: boolean;
  onChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Color"
          className="h-7 w-7 shrink-0 rounded-full bg-[var(--swatch)] ring-offset-2 ring-offset-background disabled:opacity-50 data-[state=open]:ring-2 data-[state=open]:ring-foreground"
          style={{ "--swatch": color } as CSSProperties}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="calendar-draft w-auto p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {CALENDAR_EVENT_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              aria-pressed={swatch === color}
              className={cn(
                "h-6 w-6 rounded-full bg-[var(--swatch)] ring-offset-2 ring-offset-popover",
                swatch === color && "ring-2 ring-foreground",
              )}
              style={{ "--swatch": swatch } as CSSProperties}
              onClick={() => onChange(swatch)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
