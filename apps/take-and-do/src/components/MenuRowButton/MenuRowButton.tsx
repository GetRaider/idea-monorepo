"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

type MenuRowButtonProps = UiProps<"button"> & {
  rowTransition: "all" | "colors";
};

export function MenuRowButton({
  className,
  type = "button",
  rowTransition,
  ref,
  ...props
}: MenuRowButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left text-sm text-white first:rounded-t-lg last:rounded-b-lg hover:bg-[#3a3a3a]",
        rowTransition === "all"
          ? "transition-all duration-200"
          : "transition-colors duration-200",
        className,
      )}
      {...props}
    />
  );
}
