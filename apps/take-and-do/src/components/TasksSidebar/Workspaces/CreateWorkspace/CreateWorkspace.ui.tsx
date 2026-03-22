"use client";

import type { ComponentProps } from "react";

import { Input as BaseInput } from "@/components/Input";
import { cn } from "@/lib/utils";

type FormGroupProps = ComponentProps<"div">;

export function FormGroup({ className, ref, ...props }: FormGroupProps) {
  return <div ref={ref} className={cn("mb-5", className)} {...props} />;
}

type LabelProps = ComponentProps<"label">;

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <label
      ref={ref}
      className={cn("mb-2 block text-sm font-medium text-[#888]", className)}
      {...props}
    />
  );
}

type InputProps = ComponentProps<typeof BaseInput>;

export function Input({ className, ref, ...props }: InputProps) {
  return (
    <BaseInput
      ref={ref}
      className={cn(
        "rounded-lg transition-all duration-200 focus:border-[#7255c1] focus:bg-[#252525]",
        className,
      )}
      {...props}
    />
  );
}

type TypeSelectorProps = ComponentProps<"div">;

export function TypeSelector({ className, ref, ...props }: TypeSelectorProps) {
  return (
    <div ref={ref} className={cn("mb-5 flex gap-3", className)} {...props} />
  );
}

type TypeButtonProps = ComponentProps<"button"> & {
  $selected?: boolean;
};

export function TypeButton({
  className,
  type = "button",
  $selected,
  ref,
  ...props
}: TypeButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-lg border px-4 py-3.5 text-sm font-medium text-[#e0e0e0] transition-all duration-200 [&_img]:h-5 [&_img]:w-5",
        $selected
          ? "border-[#7255c1] bg-[#2a2540] hover:border-[#7255c1] hover:bg-[#2a2540]"
          : "border-border-app bg-card-bg hover:border-[#3a3a3a] hover:bg-[#252525]",
        className,
      )}
      {...props}
    />
  );
}

type ButtonGroupProps = ComponentProps<"div">;

export function ButtonGroup({ className, ref, ...props }: ButtonGroupProps) {
  return (
    <div
      ref={ref}
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  );
}

type ModalButtonProps = ComponentProps<"button"> & {
  $primary?: boolean;
};

export function Button({
  className,
  type = "button",
  $primary,
  disabled,
  ref,
  ...props
}: ModalButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "cursor-pointer rounded-lg border-0 px-5 py-2.5 text-sm font-medium transition-all duration-200",
        $primary
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
