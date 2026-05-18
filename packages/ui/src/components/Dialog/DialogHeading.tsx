"use client";

import { cn } from "../../lib/cn";
import type { UiProps } from "../../lib/ui-props";

export function DialogHeading({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn(
        "m-0 text-2xl font-semibold text-[color:var(--text-primary,#e5e5e5)]",
        className,
      )}
      {...props}
    />
  );
}
