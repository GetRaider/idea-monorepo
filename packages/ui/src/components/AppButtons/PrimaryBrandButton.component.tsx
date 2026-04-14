"use client";

import type { ComponentProps } from "react";

import { cn } from "../../lib/cn";

const sizeClasses = {
  sm: "gap-1.5 px-5 py-2.5 text-sm",
  md: "gap-2 px-7 py-3.5 text-base",
} as const;

const baseClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border-0 bg-[#7255c1] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

type PrimaryBrandButtonProps = ComponentProps<"button"> & {
  size?: keyof typeof sizeClasses;
};

export function PrimaryBrandButton({
  className,
  size = "md",
  type = "button",
  ...props
}: PrimaryBrandButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseClass, sizeClasses[size], className)}
      {...props}
    />
  );
}
