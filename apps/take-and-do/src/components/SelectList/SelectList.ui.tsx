"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

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
