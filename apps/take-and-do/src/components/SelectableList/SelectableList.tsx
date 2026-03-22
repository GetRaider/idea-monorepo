"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function SelectableListTitle({
  className,
  ref,
  ...props
}: UiProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn("m-0 text-base font-semibold text-white", className)}
      {...props}
    />
  );
}

export function TaskSelectionHeader({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function SelectAllRow({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-focus-ring transition-colors duration-150 hover:text-[#9678e3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function TaskSelectionSection({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-2",
        className,
      )}
      {...props}
    />
  );
}

export function TaskCheckbox({
  className,
  type = "checkbox",
  ref,
  ...props
}: UiProps<"input">) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-[18px] w-[18px] cursor-pointer accent-[#7255c1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        className,
      )}
      {...props}
    />
  );
}

export function TaskLabel({ className, ref, ...props }: UiProps<"label">) {
  return (
    <label
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-input-border bg-input-bg px-4 py-3 transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#2f2f2f] focus-within:border-focus-ring focus-within:shadow-[0_0_0_3px_rgba(114,85,193,0.25)] [&_span]:text-sm [&_span]:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}
