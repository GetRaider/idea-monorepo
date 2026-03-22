"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

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
  isDragOver?: boolean;
  isEmpty?: boolean;
  bodyScrolls?: boolean;
  contentMinHeightPx?: number;
};

export function ColumnContent({
  className,
  style,
  isDragOver,
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
        "relative flex flex-col gap-3 pr-1 transition-colors duration-200 [&>*]:transition-[transform,opacity,height,margin] [&>*]:duration-300 [&>*]:[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
        bodyScrolls !== false
          ? "flex-1 overflow-y-auto"
          : "flex-[0_0_auto] overflow-y-visible",
        isDragOver
          ? "rounded-lg bg-[rgba(114,85,193,0.15)]"
          : "rounded-none bg-transparent",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-[#2a2a2a] hover:[&::-webkit-scrollbar-thumb]:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyColumnTopIndicator({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-2 h-1 rounded-sm bg-[#7255c1] transition-all duration-200 ease-out",
        className,
      )}
      {...props}
    />
  );
}

type EmptyColumnPlaceholderProps = UiProps<"div"> & {
  isDragOver?: boolean;
};

export function EmptyColumnPlaceholder({
  className,
  isDragOver,
  ref,
  ...props
}: EmptyColumnPlaceholderProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border p-4 text-sm transition-all duration-200",
        isDragOver
          ? "border-2 border-dashed border-[#7255c1] text-[#7255c1] opacity-100"
          : "border border-dashed border-[rgba(42,42,42,0.5)] text-[rgba(102,102,102,0.5)] opacity-30",
        className,
      )}
      {...props}
    />
  );
}

export function DropIndicator({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-2 h-0.5 rounded-sm bg-[#7255c1] transition-all duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-[transform,opacity]",
        className,
      )}
      {...props}
    />
  );
}

export function DropIndicatorBetween({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-1.5 h-0.5 rounded-sm bg-[#7255c1] transition-all duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-[transform,opacity]",
        className,
      )}
      {...props}
    />
  );
}

export function DropIndicatorEnd({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 h-0.5 rounded-sm bg-[#7255c1] transition-all duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-[transform,opacity]",
        className,
      )}
      {...props}
    />
  );
}

type TaskWrapperProps = UiProps<"div"> & {
  isDropped?: boolean;
};

export function TaskWrapper({
  className,
  isDropped,
  ref,
  ...props
}: TaskWrapperProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative will-change-[transform,opacity] transition-[transform,opacity,margin] duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
        isDropped && "animate-task-drop-in",
        className,
      )}
      {...props}
    />
  );
}
