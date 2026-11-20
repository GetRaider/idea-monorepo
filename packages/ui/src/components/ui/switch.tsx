"use client";

import * as React from "react";

import { cn } from "../../lib/cn";

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

// Shared shadcn-style Switch API; native button semantics keep it keyboard
// accessible without introducing a new component-system dependency.
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && !disabled) onCheckedChange(!checked);
      }}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#f2f2f0]" : "bg-white/20",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-[#121212] shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5 bg-[#f2f2f0]",
        )}
      />
    </button>
  ),
);

Switch.displayName = "Switch";
