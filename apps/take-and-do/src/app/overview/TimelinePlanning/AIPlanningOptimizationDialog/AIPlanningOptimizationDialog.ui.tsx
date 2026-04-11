"use client";

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
      className={cn("mb-8 flex items-start justify-between", className)}
      {...props}
    />
  );
}

export function HeaderContent({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 pr-4", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm font-normal text-slate-300", className)}
      {...props}
    />
  );
}

export function OptimizationContent({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  );
}

export function SummarySection({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg bg-input-bg p-4", className)}
      {...props}
    />
  );
}

export function SummaryText({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm leading-relaxed text-slate-200", className)}
      {...props}
    />
  );
}

export function WorkloadGrid({ className, ref, ...props }: UiProps<"div">) {
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

export function WorkloadCard({ className, ref, ...props }: UiProps<"div">) {
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

export function WorkloadLabel({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-2 text-xs text-slate-400", className)}
      {...props}
    />
  );
}

export function WorkloadValue({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("text-2xl font-semibold text-white", className)}
      {...props}
    />
  );
}

export function RecommendationsSection({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

export function SectionTitle({ className, ref, ...props }: UiProps<"h3">) {
  return (
    <h3
      ref={ref}
      className={cn("m-0 text-base font-semibold text-white", className)}
      {...props}
    />
  );
}

export function RecommendationCard({
  className,
  ref,
  ...props
}: UiProps<"div">) {
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

export function TaskName({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-2 text-sm font-semibold text-white", className)}
      {...props}
    />
  );
}

export function ScheduleChange({ className, ref, ...props }: UiProps<"div">) {
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

export function ArrowIcon({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span ref={ref} className={cn("text-indigo-500", className)} {...props} />
  );
}

export function ReasonText({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("text-[13px] leading-normal text-slate-300", className)}
      {...props}
    />
  );
}

export function RisksList({ className, ref, ...props }: UiProps<"ul">) {
  return <ul ref={ref} className={cn("m-0 pl-5", className)} {...props} />;
}

export function RiskItem({ className, ref, ...props }: UiProps<"li">) {
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

export function InsightsList({ className, ref, ...props }: UiProps<"ul">) {
  return <ul ref={ref} className={cn("m-0 pl-5", className)} {...props} />;
}

export function InsightItem({ className, ref, ...props }: UiProps<"li">) {
  return (
    <li
      ref={ref}
      className={cn("mb-1 text-sm leading-relaxed text-slate-300", className)}
      {...props}
    />
  );
}

export function ErrorState({ className, ref, ...props }: UiProps<"div">) {
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

export function ActionsContainer({ className, ref, ...props }: UiProps<"div">) {
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
