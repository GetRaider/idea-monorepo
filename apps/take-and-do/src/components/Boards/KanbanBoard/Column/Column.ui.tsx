"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

import { TaskStatus } from "../types";

type ColumnRootProps = UiProps<"div"> & {
  bodyScrolls?: boolean;
};

export function Column({
  className,
  bodyScrolls = true,
  ref,
  ...props
}: ColumnRootProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "m-0 flex min-w-[320px] flex-col gap-4",
        bodyScrolls ? "min-h-0" : "min-h-auto",
        className,
      )}
      {...props}
    />
  );
}

export function ColumnHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function ColumnTitle({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 text-sm font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}

type StatusIconProps = UiProps<"span"> & {
  status?: TaskStatus;
};

export function StatusIcon({
  className,
  status,
  ref,
  ...props
}: StatusIconProps) {
  const colorClass =
    status === TaskStatus.IN_PROGRESS
      ? "text-amber-500"
      : status === TaskStatus.DONE
        ? "text-emerald-500"
        : "text-[#888]";

  return (
    <span
      ref={ref}
      className={cn("text-base", colorClass, className)}
      {...props}
    />
  );
}

export function Count({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "flex h-5 min-w-6 items-center justify-center rounded-[10px] bg-input-bg px-1.5 text-xs font-medium text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type ColumnContentProps = UiProps<"div"> & {
  isActiveDrop?: boolean;
  isEmpty?: boolean;
  bodyScrolls?: boolean;
  contentMinHeightPx?: number;
};

export function ColumnContent({
  className,
  style,
  isActiveDrop,
  isEmpty,
  bodyScrolls = true,
  contentMinHeightPx,
  ref,
  ...props
}: ColumnContentProps) {
  const minHeight =
    contentMinHeightPx != null
      ? `${contentMinHeightPx}px`
      : isEmpty
        ? "100px"
        : undefined;

  return (
    <div
      ref={ref}
      style={{
        ...style,
        ...(minHeight ? { minHeight } : {}),
      }}
      className={cn(
        // Drop zones provide their own vertical breathing room; using `gap-0`
        // here keeps them flush so we don't double-stack space between cards.
        // `px-2` adds a small horizontal inset so cards never kiss the active-
        // drop ring drawn at column edges.
        "relative flex flex-col gap-0 px-2 transition-[background-color,box-shadow] duration-150",
        bodyScrolls !== false
          ? "min-h-0 flex-1 overflow-y-auto"
          : "flex-[0_0_auto] overflow-y-visible",
        isActiveDrop &&
          "rounded-2xl bg-focus-ring/[0.06] shadow-[inset_0_0_0_2px_var(--focus-ring)]",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-[#2a2a2a] hover:[&::-webkit-scrollbar-thumb]:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}
