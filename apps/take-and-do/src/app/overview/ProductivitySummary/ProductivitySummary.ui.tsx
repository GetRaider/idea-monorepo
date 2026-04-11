"use client";

import {
  Section,
  SectionHeader,
  SectionTitle,
  Controls,
  TimeframeSelect,
  AISection,
  AICard,
  CardHeader,
  CardTitle,
  AIBadge,
  CardContent,
  CardList,
} from "../productivity-blocks";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export {
  Section,
  SectionHeader,
  SectionTitle,
  Controls,
  TimeframeSelect,
  AISection,
  AICard,
  CardHeader,
  CardTitle,
  AIBadge,
  CardContent,
  CardList,
};

export function DropdownContainer({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return <div ref={ref} className={cn("relative", className)} {...props} />;
}

export function DropdownMenu({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-full z-[1001] mt-1 min-w-[150px] overflow-hidden rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        className,
      )}
      {...props}
    />
  );
}

type DropdownItemProps = UiProps<"button"> & {
  hasBorder?: boolean;
};

export function DropdownItem({
  className,
  type = "button",
  hasBorder,
  ref,
  ...props
}: DropdownItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "w-full cursor-pointer border-0 bg-transparent px-3 py-2.5 text-left text-sm text-white transition-colors duration-200 hover:bg-[#3a3a3a]",
        hasBorder && "border-t border-input-border",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p ref={ref} className={cn("m-0 text-[#888]", className)} {...props} />
  );
}
