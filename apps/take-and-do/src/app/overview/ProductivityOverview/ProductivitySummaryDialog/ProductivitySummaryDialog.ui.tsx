"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function DialogContent({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "max-h-[90vh] min-h-[400px] w-full max-w-[800px] overflow-y-auto rounded-xl border border-border-app bg-[#1a1a1a] p-6 text-white",
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-6 flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function AISection({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4",
        className,
      )}
      {...props}
    />
  );
}

export function AICard({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-[#333] bg-input-bg p-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  style,
  accentColor,
  ref,
  ...props
}: UiProps<"h3"> & { accentColor?: string }) {
  return (
    <h3
      ref={ref}
      style={{ ...style, color: accentColor ?? "#fff" }}
      className={cn("m-0 text-base font-semibold", className)}
      {...props}
    />
  );
}

export function AIBadge({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "rounded-xl bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm leading-relaxed text-slate-300", className)}
      {...props}
    />
  );
}

export function CardList({ className, ref, ...props }: UiProps<"ul">) {
  return (
    <ul
      ref={ref}
      className={cn("m-0 pl-5 text-sm leading-loose text-slate-300", className)}
      {...props}
    />
  );
}
