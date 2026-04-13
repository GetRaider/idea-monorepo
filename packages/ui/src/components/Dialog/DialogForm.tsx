"use client";

import { cn } from "../../lib/cn";
import type { UiProps } from "../../lib/ui-props";

export function DialogFormGroup({ className, ref, ...props }: UiProps<"div">) {
  return <div ref={ref} className={cn("mb-5", className)} {...props} />;
}

export function DialogFormLabel({
  className,
  ref,
  ...props
}: UiProps<"label">) {
  return (
    <label
      ref={ref}
      className={cn("mb-2 block text-sm font-medium text-zinc-500", className)}
      {...props}
    />
  );
}

export function DialogFormActions({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  );
}

type DialogFormButtonProps = UiProps<"button"> & {
  primary?: boolean;
};

export function DialogFormButton({
  className,
  type = "button",
  primary,
  disabled,
  ref,
  ...props
}: DialogFormButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "cursor-pointer rounded-lg border-0 px-5 py-2.5 text-sm font-medium transition-all duration-200",
        primary
          ? disabled
            ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
            : "bg-violet-600 text-white hover:bg-violet-700 hover:disabled:bg-zinc-800"
          : "border border-zinc-600 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
