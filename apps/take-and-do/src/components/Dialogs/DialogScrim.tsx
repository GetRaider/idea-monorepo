"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function DialogScrim({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-5",
        className,
      )}
      {...props}
    />
  );
}
