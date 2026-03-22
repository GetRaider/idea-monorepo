"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

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
      className={cn("mb-2 block text-sm font-medium text-[#888]", className)}
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
            ? "cursor-not-allowed bg-[#2a2a2a] text-[#666]"
            : "bg-[#7255c1] text-white hover:bg-[#5a42a1] hover:disabled:bg-[#2a2a2a]"
          : "border border-border-app bg-transparent text-[#888] hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
