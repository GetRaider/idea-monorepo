"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type EmptyStateContainerProps = ComponentProps<"div">;

export function EmptyStateContainer({
  className,
  ref,
  ...props
}: EmptyStateContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center px-5 py-10 text-center",
        className,
      )}
      {...props}
    />
  );
}

type EmptyStateImageWrapperProps = ComponentProps<"div">;

export function EmptyStateImageWrapper({
  className,
  ref,
  ...props
}: EmptyStateImageWrapperProps) {
  return (
    <div
      ref={ref}
      className={cn("relative mb-4 h-24 w-24", className)}
      {...props}
    />
  );
}

type EmptyStateTitleProps = ComponentProps<"p">;

export function EmptyStateTitle({
  className,
  ref,
  ...props
}: EmptyStateTitleProps) {
  return (
    <p
      ref={ref}
      className={cn("m-0 mb-2 text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}

type EmptyStateTextProps = ComponentProps<"p">;

export function EmptyStateText({
  className,
  ref,
  ...props
}: EmptyStateTextProps) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm text-[#888]", className)}
      {...props}
    />
  );
}
