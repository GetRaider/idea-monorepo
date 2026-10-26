"use client";

import type { ComponentProps } from "react";
import { Button } from "@repo/ui";

import { PlusIcon } from "./icons";

export function NewButton({
  size = "sm",
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button size={size} {...props}>
      <PlusIcon size={16} />
      {children ?? "New"}
    </Button>
  );
}
