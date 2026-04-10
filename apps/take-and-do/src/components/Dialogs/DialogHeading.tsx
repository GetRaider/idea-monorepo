"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function DialogHeading({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn("m-0 text-2xl font-semibold text-white", className)}
      {...props}
    />
  );
}
