"use client";

import type { ComponentProps } from "react";

import { gradientActionButtonClass } from "@/lib/animated-gradient";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"div">;

export function Section({ className, ref, ...props }: SectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-6 rounded-xl border border-border-app bg-[#1a1a1a] p-6",
        className,
      )}
      {...props}
    />
  );
}

type SectionHeaderProps = ComponentProps<"div">;

export function SectionHeader({
  className,
  ref,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-4 flex items-center justify-between", className)}
      {...props}
    />
  );
}

type SectionTitleProps = ComponentProps<"h2">;

export function SectionTitle({ className, ref, ...props }: SectionTitleProps) {
  return (
    <h2
      ref={ref}
      className={cn("m-0 text-xl font-semibold text-white", className)}
      {...props}
    />
  );
}

type ControlsProps = ComponentProps<"div">;

export function Controls({ className, ref, ...props }: ControlsProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  );
}

type TimeframeSelectProps = ComponentProps<"select">;

export function TimeframeSelect({
  className,
  ref,
  ...props
}: TimeframeSelectProps) {
  return (
    <select
      ref={ref}
      className={cn(
        "cursor-pointer rounded-md border border-input-border bg-input-bg px-3 py-1.5 text-sm text-white",
        className,
      )}
      {...props}
    />
  );
}

type GenerateButtonProps = ComponentProps<"button"> & {
  $disabled?: boolean;
};

export function GenerateButton({
  className,
  type = "button",
  $disabled,
  disabled,
  ref,
  ...props
}: GenerateButtonProps) {
  const isDisabled = disabled ?? $disabled;
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

type ChartsGridProps = ComponentProps<"div">;

export function ChartsGrid({ className, ref, ...props }: ChartsGridProps) {
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

type ChartCardProps = ComponentProps<"div">;

export function ChartCard({ className, ref, ...props }: ChartCardProps) {
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

type ChartTitleProps = ComponentProps<"h4">;

export function ChartTitle({ className, ref, ...props }: ChartTitleProps) {
  return (
    <h4
      ref={ref}
      className={cn("m-0 mb-3 text-sm font-semibold text-[#888]", className)}
      {...props}
    />
  );
}

type MetricsContainerProps = ComponentProps<"div">;

export function MetricsContainer({
  className,
  ref,
  ...props
}: MetricsContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

type MetricRowProps = ComponentProps<"div">;

export function MetricRow({ className, ref, ...props }: MetricRowProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-1 flex justify-between", className)}
      {...props}
    />
  );
}

type MetricLabelProps = ComponentProps<"span">;

export function MetricLabel({ className, ref, ...props }: MetricLabelProps) {
  return (
    <span
      ref={ref}
      className={cn("text-[13px] text-slate-300", className)}
      {...props}
    />
  );
}

type MetricValueProps = ComponentProps<"span"> & { $warning?: boolean };

export function MetricValue({
  className,
  $warning,
  ref,
  ...props
}: MetricValueProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "text-sm font-semibold",
        $warning ? "text-amber-500" : "text-white",
        className,
      )}
      {...props}
    />
  );
}

type ProgressBarContainerProps = ComponentProps<"div">;

export function ProgressBarContainer({
  className,
  ref,
  ...props
}: ProgressBarContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("h-1.5 overflow-hidden rounded-sm bg-input-bg", className)}
      {...props}
    />
  );
}

type ProgressBarProps = ComponentProps<"div"> & {
  $progress: number;
  $warning?: boolean;
};

export function ProgressBar({
  className,
  style,
  $progress,
  $warning,
  ref,
  ...props
}: ProgressBarProps) {
  return (
    <div
      ref={ref}
      style={{ ...style, width: `${$progress}%` }}
      className={cn(
        "h-full transition-[width] duration-300",
        $warning ? "bg-amber-500" : "bg-indigo-500",
        className,
      )}
      {...props}
    />
  );
}

type LoadingContainerProps = ComponentProps<"div">;

export function LoadingContainer({
  className,
  ref,
  ...props
}: LoadingContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center p-10", className)}
      {...props}
    />
  );
}

type SpinnerProps = ComponentProps<"div">;

export function Spinner({ className, ref, ...props }: SpinnerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "h-10 w-10 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-indigo-500",
        className,
      )}
      {...props}
    />
  );
}
