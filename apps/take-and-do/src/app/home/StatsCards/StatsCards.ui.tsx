"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type StatsGridProps = ComponentProps<"div">;

export function StatsGrid({ className, ref, ...props }: StatsGridProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-10 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5",
        className,
      )}
      {...props}
    />
  );
}

type StatCardProps = ComponentProps<"div">;

export function StatCard({ className, ref, ...props }: StatCardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border-app bg-[#1a1a1a] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500",
        className,
      )}
      {...props}
    />
  );
}

type StatIconProps = ComponentProps<"div">;

export function StatIcon({ className, ref, ...props }: StatIconProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg bg-input-bg text-indigo-500",
        className,
      )}
      {...props}
    />
  );
}

type StatValueProps = ComponentProps<"div">;

export function StatValue({ className, ref, ...props }: StatValueProps) {
  return (
    <div
      ref={ref}
      className={cn("text-[32px] font-bold leading-none text-white", className)}
      {...props}
    />
  );
}

type StatLabelProps = ComponentProps<"div">;

export function StatLabel({ className, ref, ...props }: StatLabelProps) {
  return (
    <div
      ref={ref}
      className={cn("text-sm font-medium text-[#888]", className)}
      {...props}
    />
  );
}
