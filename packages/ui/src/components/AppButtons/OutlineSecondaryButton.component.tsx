"use client";

import type { ComponentProps } from "react";

import { cn } from "../../lib/cn";

type OutlineSecondaryButtonProps = ComponentProps<"button"> & {
  inactive?: boolean;
  backgroundStyle?: string;
};

export function OutlineSecondaryButton({
  className,
  type = "button",
  inactive,
  backgroundStyle,
  style,
  disabled,
  ...props
}: OutlineSecondaryButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
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
