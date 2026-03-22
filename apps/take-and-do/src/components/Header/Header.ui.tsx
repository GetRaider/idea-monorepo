"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function HeaderContainer({
  className,
  ref,
  ...props
}: UiProps<"header">) {
  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center border-b border-border-app bg-nav-sidebar-bg px-8",
        className,
      )}
      {...props}
    />
  );
}

export function Content({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex w-full items-center justify-between", className)}
      {...props}
    />
  );
}

export function Title({ className, ref, ...props }: UiProps<"h1">) {
  return (
    <h1
      ref={ref}
      className={cn("m-0 text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}
