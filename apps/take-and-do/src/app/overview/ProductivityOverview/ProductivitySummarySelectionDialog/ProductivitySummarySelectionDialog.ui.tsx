"use client";

import { gradientOptionSurfaceClass } from "@/lib/styles/animated-gradient";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function DialogContent({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex max-h-[90vh] min-h-[400px] w-full max-w-[800px] flex-col overflow-y-auto rounded-xl border border-border-app bg-[#1a1a1a] p-8 text-white",
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative mb-8 flex items-start justify-between",
        className,
      )}
      {...props}
    />
  );
}

export function HeaderContent({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col gap-2 pr-4", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ref, ...props }: UiProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn(
        "m-0 text-sm font-normal leading-normal text-slate-300",
        className,
      )}
      {...props}
    />
  );
}

export function OptionsContainer({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-8 flex flex-1 flex-col gap-4", className)}
      {...props}
    />
  );
}

type OptionBlockProps = UiProps<"div"> & {
  isSelected: boolean;
  isAi?: boolean;
};

export function OptionBlock({
  className,
  isSelected,
  isAi,
  ref,
  ...props
}: OptionBlockProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-lg border-2 p-6 transition-all duration-200 motion-reduce:!animate-none motion-reduce:!bg-[#7255c1]",
        isAi
          ? cn(
              gradientOptionSurfaceClass,
              "hover:animate-gradient-shift-fast",
              isSelected ? "border-[#7255c1]" : "border-input-border",
            )
          : cn(
              "bg-input-bg",
              isSelected
                ? "border-[#7255c1] hover:border-[#7255c1] hover:bg-input-bg"
                : "border-input-border hover:border-[#4a4a4a] hover:bg-[#2f2f2f]",
            ),
        className,
      )}
      {...props}
    />
  );
}

export function OptionTitle({ className, ref, ...props }: UiProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn("m-0 mb-2 text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}

export function OptionDescription({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm leading-relaxed text-slate-300", className)}
      {...props}
    />
  );
}

export function ActionsContainer({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-end gap-3 border-t border-border-app pt-6",
        className,
      )}
      {...props}
    />
  );
}
