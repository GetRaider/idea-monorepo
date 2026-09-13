import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { ComponentProps } from "react";

import { cn } from "../../lib/cn";

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border border-tempo-line-2 bg-transparent text-tempo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tempo-accent disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:border-tempo-accent data-[state=checked]:bg-tempo-accent-wash",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;
