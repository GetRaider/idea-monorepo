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
        "cursor-pointer px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        primary
          ? disabled
            ? "cursor-not-allowed rounded-xl border border-black/[0.08] bg-gradient-to-b from-zinc-200/35 to-zinc-400/35 text-zinc-600 opacity-90"
            : "rounded-xl border border-black/[0.12] bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:-translate-y-0.5 hover:brightness-[1.03] focus-visible:outline-zinc-400/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          : "rounded-lg border border-zinc-600 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-[color:var(--text-primary,#e5e5e5)] focus-visible:outline-zinc-400",
        className,
      )}
      {...props}
    />
  );
}
