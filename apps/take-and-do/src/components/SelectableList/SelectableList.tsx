"use client";

import { cn } from "@/lib/styles/utils";
import { Check } from "lucide-react";
import type { UiProps } from "@/lib/styles/ui-props";

export function SelectableListTitle({
  className,
  ref,
  ...props
}: UiProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn("m-0 text-base font-semibold text-text-primary", className)}
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
        "cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60",
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
  checked,
  onChange,
  ...props
}: Omit<UiProps<"input">, "type"> & { checked?: boolean }) {
  return (
    <label
      className="relative inline-flex cursor-pointer items-center"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <div
        className={cn(
          "relative h-[18px] w-[18px] rounded-[5px] border-2 transition-all duration-200",
          "border-zinc-600 bg-zinc-800/50",
          "peer-hover:border-white/35 peer-hover:bg-zinc-700/50",
          "peer-checked:border-zinc-400 peer-checked:bg-zinc-600",
          "peer-checked:shadow-[0_0_10px_rgba(255,255,255,0.08)]",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-zinc-500",
          "group",
          className,
        )}
      >
        <Check
          className={cn(
            "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-text-primary transition-all duration-200",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
          strokeWidth={3}
        />
      </div>
    </label>
  );
}

export function TaskLabel({ className, ref, ...props }: UiProps<"label">) {
  return (
    <label
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-input-border bg-input-bg px-4 py-3 transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#2f2f2f] focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.12)] [&_span]:text-sm [&_span]:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}
