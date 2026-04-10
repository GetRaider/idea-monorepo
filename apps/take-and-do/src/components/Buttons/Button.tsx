"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function CloseButton({
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
        "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-[28px] leading-none text-text-secondary transition-all duration-200 hover:bg-border-app hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-transparent hover:disabled:text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

type SecondaryButtonProps = UiProps<"button"> & {
  inactive?: boolean;
  backgroundStyle?: string;
};

export function Button({
  className,
  type = "button",
  inactive,
  backgroundStyle,
  style,
  disabled,
  ref,
  ...props
}: SecondaryButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      style={{
        ...style,
        ...(backgroundStyle ? { background: backgroundStyle } : {}),
      }}
      className={cn(
        "cursor-pointer rounded-md border border-[#3a3a3a] bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#2a2a2a]",
        isDisabled && "cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}
