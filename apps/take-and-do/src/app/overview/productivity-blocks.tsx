"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

type SectionProps = UiProps<"div"> & {
  withBottomMargin?: boolean;
};

export function Section({
  className,
  withBottomMargin,
  ref,
  ...props
}: SectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border-app bg-[#1a1a1a] p-6",
        withBottomMargin && "mb-6",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-4 flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function SectionTitle({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn(
        "m-0 flex items-center gap-2 text-xl font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Controls({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  );
}

export function TimeframeSelect({
  className,
  ref,
  ...props
}: UiProps<"select">) {
  return (
    <select
      ref={ref}
      className={cn(
        "cursor-pointer rounded-md border border-input-border bg-input-bg px-3 py-1.5 text-sm text-white",
        className,
      )}
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

type CardTitleProps = UiProps<"h3"> & { accentColor?: string };

export function CardTitle({
  className,
  style,
  accentColor,
  ref,
  ...props
}: CardTitleProps) {
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
