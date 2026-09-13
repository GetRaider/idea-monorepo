import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-xl text-[15px] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-30",
  {
    variants: {
      variant: {
        primary:
          "bg-tempo-text px-10 py-3.5 font-semibold text-tempo-on-primary hover:opacity-[0.86] active:scale-[0.98]",
        secondary:
          "border border-tempo-line-2 bg-transparent px-[22px] py-3.5 text-tempo-muted hover:text-tempo-text",
        ghost: "bg-transparent px-3 py-2 text-tempo-muted hover:text-tempo-text",
        danger:
          "border border-tempo-danger/40 bg-transparent px-[22px] py-3.5 text-tempo-danger hover:text-tempo-text",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
