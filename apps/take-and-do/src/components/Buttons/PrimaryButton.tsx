"use client";

import { cn } from "@/lib/styles/utils";
import {
  chromePrimaryButtonBase,
  chromePrimaryButtonInteractive,
} from "@/lib/styles/chrome-primary-button-classes";
import type { UiProps } from "@/lib/styles/ui-props";

const sizeClasses = {
  sm: "gap-1.5 px-5 py-2.5 text-sm",
  md: "gap-2 px-7 py-3.5 text-base",
} as const;

const variantClasses = {
  /** Soft light bar + charcoal text (app chrome reference). */
  brand: cn(chromePrimaryButtonBase, chromePrimaryButtonInteractive),
  /** Dark neutral chrome (rare alternate CTA). */
  surface:
    "rounded-xl border border-white/[0.08] bg-gradient-to-b from-[#3f3f3f] to-[#1f1f1f] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30",
  inverted:
    "rounded-xl border border-white/10 bg-chrome-cta-inverted-bg text-chrome-cta-inverted-fg transition-all duration-200 hover:-translate-y-0.5 hover:bg-chrome-cta-inverted-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
} as const;

const baseClass =
  "inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

export function PrimaryButton({
  className,
  size = "md",
  variant = "brand",
  type = "button",
  ref,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        baseClass,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

interface PrimaryButtonProps extends Omit<UiProps<"button">, "size"> {
  size?: keyof typeof sizeClasses;
  variant?: keyof typeof variantClasses;
}
