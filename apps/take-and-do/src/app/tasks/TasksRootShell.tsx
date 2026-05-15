"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function TasksRouteRootShell({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 flex-1 flex-col max-lg:overflow-y-auto lg:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
