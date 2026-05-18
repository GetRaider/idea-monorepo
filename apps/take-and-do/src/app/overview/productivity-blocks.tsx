"use client";

import {
  APP_CHROME_HEADER_CONTROL_GAP,
  APP_CHROME_SECTION_BODY_PADDING,
  APP_CHROME_SECTION_HEAD_PADDING,
  APP_CHROME_SECTION_TITLE_SIZE,
} from "@/helpers/app-chrome-layout";
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
        "overflow-hidden rounded-xl border border-border-app bg-background-primary",
        withBottomMargin && "mb-6",
        className,
      )}
      {...props}
    />
  );
}

/** Legacy stacked header (e.g. forms with margin below). Prefer `SectionHeadBand` for cards. */
export function SectionHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-4 flex w-full min-w-0 items-center justify-between gap-3 sm:gap-4",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeadBand({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-3 sm:flex-nowrap",
        APP_CHROME_SECTION_HEAD_PADDING,
        className,
      )}
      {...props}
    />
  );
}

export function SectionDivider({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn("h-px w-full shrink-0 bg-border-app", className)}
      {...props}
    />
  );
}

export function SectionBody({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(APP_CHROME_SECTION_BODY_PADDING, className)}
      {...props}
    />
  );
}

export function SectionTitle({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn(
        "m-0 flex min-w-0 flex-1 items-center gap-2",
        APP_CHROME_SECTION_TITLE_SIZE,
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
      className={cn(
        "flex min-w-0 shrink-0 flex-wrap items-center justify-end",
        APP_CHROME_HEADER_CONTROL_GAP,
        className,
      )}
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
        "cursor-pointer rounded-md border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary",
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
        "grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5",
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
        "rounded-lg border border-[#333] bg-input-bg p-5 sm:p-6",
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
      style={{ ...style, color: accentColor ?? "var(--text-primary)" }}
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
        "rounded-xl bg-zinc-600 px-2 py-0.5 text-[11px] font-semibold uppercase",
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
