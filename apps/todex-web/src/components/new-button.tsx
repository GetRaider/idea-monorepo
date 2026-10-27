"use client";

import type { ComponentProps } from "react";
import { Button, cn } from "@repo/ui";

import { PlusIcon } from "./icons";

export function NewButton({
  size = "sm",
  children,
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button size={size} className={cn("primary-noise", className)} {...props}>
      <PlusIcon size={16} />
      {children ?? "New"}
    </Button>
  );
}
