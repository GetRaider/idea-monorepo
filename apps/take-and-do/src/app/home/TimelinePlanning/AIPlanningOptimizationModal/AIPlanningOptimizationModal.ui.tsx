"use client";

import type { ComponentProps } from "react";

import { gradientActionButtonClass } from "@/lib/animated-gradient";
import { cn } from "@/lib/utils";

type ModalOverlayProps = ComponentProps<"div">;

export function ModalOverlay({ className, ref, ...props }: ModalOverlayProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-5",
        className,
      )}
      {...props}
    />
  );
}

type ModalContentProps = ComponentProps<"div">;

export function ModalContent({ className, ref, ...props }: ModalContentProps) {
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

type ModalHeaderProps = ComponentProps<"div">;

export function ModalHeader({ className, ref, ...props }: ModalHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-8 flex items-start justify-between", className)}
      {...props}
    />
  );
}

type HeaderContentProps = ComponentProps<"div">;

export function HeaderContent({
  className,
  ref,
  ...props
}: HeaderContentProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 pr-4", className)}
      {...props}
    />
  );
}

type ModalTitleProps = ComponentProps<"h2">;

export function ModalTitle({ className, ref, ...props }: ModalTitleProps) {
  return (
    <h2
      ref={ref}
      className={cn("m-0 text-2xl font-semibold text-white", className)}
      {...props}
    />
  );
}

type ModalDescriptionProps = ComponentProps<"p">;

export function ModalDescription({
  className,
  ref,
  ...props
}: ModalDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm font-normal text-slate-300", className)}
      {...props}
    />
  );
}

type OptimizationContentProps = ComponentProps<"div">;

export function OptimizationContent({
  className,
  ref,
  ...props
}: OptimizationContentProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  );
}

type SummarySectionProps = ComponentProps<"div">;

export function SummarySection({
  className,
  ref,
  ...props
}: SummarySectionProps) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg bg-input-bg p-4", className)}
      {...props}
    />
  );
}

type SummaryTextProps = ComponentProps<"p">;

export function SummaryText({ className, ref, ...props }: SummaryTextProps) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm leading-relaxed text-slate-200", className)}
      {...props}
    />
  );
}

type WorkloadGridProps = ComponentProps<"div">;

export function WorkloadGrid({ className, ref, ...props }: WorkloadGridProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}

type WorkloadCardProps = ComponentProps<"div">;

export function WorkloadCard({ className, ref, ...props }: WorkloadCardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-input-border bg-input-bg p-4 text-center",
        className,
      )}
      {...props}
    />
  );
}

type WorkloadLabelProps = ComponentProps<"div">;

export function WorkloadLabel({
  className,
  ref,
  ...props
}: WorkloadLabelProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-2 text-xs text-slate-400", className)}
      {...props}
    />
  );
}

type WorkloadValueProps = ComponentProps<"div">;

export function WorkloadValue({
  className,
  ref,
  ...props
}: WorkloadValueProps) {
  return (
    <div
      ref={ref}
      className={cn("text-2xl font-semibold text-white", className)}
      {...props}
    />
  );
}

type RecommendationsSectionProps = ComponentProps<"div">;

export function RecommendationsSection({
  className,
  ref,
  ...props
}: RecommendationsSectionProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

type SectionTitleProps = ComponentProps<"h3">;

export function SectionTitle({ className, ref, ...props }: SectionTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn("m-0 text-base font-semibold text-white", className)}
      {...props}
    />
  );
}

type RecommendationCardProps = ComponentProps<"div">;

export function RecommendationCard({
  className,
  ref,
  ...props
}: RecommendationCardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-input-border bg-input-bg p-4",
        className,
      )}
      {...props}
    />
  );
}

type TaskNameProps = ComponentProps<"div">;

export function TaskName({ className, ref, ...props }: TaskNameProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-2 text-sm font-semibold text-white", className)}
      {...props}
    />
  );
}

type ScheduleChangeProps = ComponentProps<"div">;

export function ScheduleChange({
  className,
  ref,
  ...props
}: ScheduleChangeProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-2 flex items-center gap-2 text-[13px] text-slate-400 [&_strong]:inline-flex [&_strong]:items-center [&_strong]:gap-2 [&_strong]:text-emerald-500 [&_strong]:before:font-bold [&_strong]:before:content-['✓']",
        className,
      )}
      {...props}
    />
  );
}

type ArrowIconProps = ComponentProps<"span">;

export function ArrowIcon({ className, ref, ...props }: ArrowIconProps) {
  return (
    <span ref={ref} className={cn("text-indigo-500", className)} {...props} />
  );
}

type ReasonTextProps = ComponentProps<"div">;

export function ReasonText({ className, ref, ...props }: ReasonTextProps) {
  return (
    <div
      ref={ref}
      className={cn("text-[13px] leading-normal text-slate-300", className)}
      {...props}
    />
  );
}

type RisksListProps = ComponentProps<"ul">;

export function RisksList({ className, ref, ...props }: RisksListProps) {
  return <ul ref={ref} className={cn("m-0 pl-5", className)} {...props} />;
}

type RiskItemProps = ComponentProps<"li">;

export function RiskItem({ className, ref, ...props }: RiskItemProps) {
  return (
    <li
      ref={ref}
      className={cn(
        "mb-1 flex list-none items-center text-sm leading-relaxed text-amber-500 before:mr-2 before:flex-none before:content-['⚠']",
        className,
      )}
      {...props}
    />
  );
}

type InsightsListProps = ComponentProps<"ul">;

export function InsightsList({ className, ref, ...props }: InsightsListProps) {
  return <ul ref={ref} className={cn("m-0 pl-5", className)} {...props} />;
}

type InsightItemProps = ComponentProps<"li">;

export function InsightItem({ className, ref, ...props }: InsightItemProps) {
  return (
    <li
      ref={ref}
      className={cn("mb-1 text-sm leading-relaxed text-slate-300", className)}
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
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-10",
        className,
      )}
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

type LoadingStateProps = ComponentProps<"div">;

export function LoadingState({ className, ref, ...props }: LoadingStateProps) {
  return (
    <div
      ref={ref}
      className={cn("text-center text-sm text-slate-400", className)}
      {...props}
    />
  );
}

type ErrorStateProps = ComponentProps<"div">;

export function ErrorState({ className, ref, ...props }: ErrorStateProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-4 rounded-lg bg-red-500/10 p-5 text-center text-sm text-red-500",
        className,
      )}
      {...props}
    />
  );
}

type ActionsContainerProps = ComponentProps<"div">;

export function ActionsContainer({
  className,
  ref,
  ...props
}: ActionsContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-end gap-3 border-t border-border-app pt-4",
        className,
      )}
      {...props}
    />
  );
}

const gradientButtonBase =
  "rounded-md border-0 px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:!animate-none disabled:!cursor-not-allowed disabled:!bg-[#7255c1] disabled:!opacity-60 motion-reduce:!animate-none motion-reduce:!bg-[#7255c1]";

type GenerateOptimizationButtonProps = ComponentProps<"button">;

export function GenerateOptimizationButton({
  className,
  type = "button",
  ref,
  ...props
}: GenerateOptimizationButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(gradientActionButtonClass, gradientButtonBase, className)}
      {...props}
    />
  );
}

export const OptimizeButton = GenerateOptimizationButton;
