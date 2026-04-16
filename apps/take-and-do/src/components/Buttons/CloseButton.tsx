"use client";

import type { ComponentProps } from "react";

import { IconCloseButton } from "@repo/ui/components/Dialog";
import { cn } from "@/lib/styles/utils";

const themedCloseButtonClass =
  "text-[28px] leading-none text-text-secondary hover:bg-border-app hover:text-text-primary hover:disabled:bg-transparent hover:disabled:text-text-secondary";

export function CloseButton({
  className,
  ...props
}: ComponentProps<typeof IconCloseButton>) {
  return (
    <IconCloseButton
      className={cn(themedCloseButtonClass, className)}
      {...props}
    />
  );
}
