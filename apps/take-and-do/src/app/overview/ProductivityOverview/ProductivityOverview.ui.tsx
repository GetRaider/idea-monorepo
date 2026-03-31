"use client";

import {
  Section as ProductivitySection,
  SectionHeader,
  SectionTitle,
  Controls,
  TimeframeSelect,
} from "../productivity-blocks";
import { gradientActionButtonClass } from "@/lib/styles/animated-gradient";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function Section({ className, ref, ...props }: UiProps<"div">) {
  return (
    <ProductivitySection
      ref={ref}
      withBottomMargin
      className={className}
      {...props}
    />
  );
}

export { SectionHeader, SectionTitle, Controls, TimeframeSelect };

type GenerateButtonProps = UiProps<"button"> & {
  inactive?: boolean;
};

export function GenerateButton({
  className,
  type = "button",
  inactive,
  disabled,
  ref,
  ...props
}: GenerateButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "relative overflow-hidden rounded-md border-0 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 motion-reduce:!animate-none motion-reduce:!bg-[#7255c1]",
        isDisabled
          ? "cursor-not-allowed bg-[#7255c1] opacity-60"
          : cn(gradientActionButtonClass, "cursor-pointer opacity-100"),
        className,
      )}
      {...props}
    />
  );
}

export function ChartsGrid({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4",
        className,
      )}
      {...props}
    />
  );
}

export function ChartCard({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-[#333] bg-input-bg p-4",
        className,
      )}
      {...props}
    />
  );
}

export function ChartTitle({ className, ref, ...props }: UiProps<"h4">) {
  return (
    <h4
      ref={ref}
      className={cn("m-0 mb-3 text-sm font-semibold text-[#888]", className)}
      {...props}
    />
  );
}

export function MetricsContainer({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

export function MetricRow({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-1 flex justify-between", className)}
      {...props}
    />
  );
}

export function MetricLabel({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn("text-[13px] text-slate-300", className)}
      {...props}
    />
  );
}

type MetricValueProps = UiProps<"span"> & { isWarning?: boolean };

export function MetricValue({
  className,
  isWarning,
  ref,
  ...props
}: MetricValueProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "text-sm font-semibold",
        isWarning ? "text-amber-500" : "text-white",
        className,
      )}
      {...props}
    />
  );
}

export function ProgressBarContainer({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("h-1.5 overflow-hidden rounded-sm bg-input-bg", className)}
      {...props}
    />
  );
}

type ProgressBarProps = UiProps<"div"> & {
  progress: number;
  isWarning?: boolean;
};

export function ProgressBar({
  className,
  style,
  progress,
  isWarning,
  ref,
  ...props
}: ProgressBarProps) {
  return (
    <div
      ref={ref}
      style={{ ...style, width: `${progress}%` }}
      className={cn(
        "h-full transition-[width] duration-300",
        isWarning ? "bg-amber-500" : "bg-indigo-500",
        className,
      )}
      {...props}
    />
  );
}
