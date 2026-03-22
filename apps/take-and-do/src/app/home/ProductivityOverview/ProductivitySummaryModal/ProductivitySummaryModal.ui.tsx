"use client";

import type { ComponentProps } from "react";

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
        "max-h-[90vh] min-h-[400px] w-full max-w-[800px] overflow-y-auto rounded-xl border border-border-app bg-[#1a1a1a] p-6 text-white",
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
      className={cn("mb-6 flex items-center justify-between", className)}
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

type AISectionProps = ComponentProps<"div">;

export function AISection({ className, ref, ...props }: AISectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4",
        className,
      )}
      {...props}
    />
  );
}

type AICardProps = ComponentProps<"div">;

export function AICard({ className, ref, ...props }: AICardProps) {
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

type CardHeaderProps = ComponentProps<"div">;

export function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-center justify-between", className)}
      {...props}
    />
  );
}

type CardTitleProps = ComponentProps<"h3"> & { $color?: string };

export function CardTitle({
  className,
  style,
  $color,
  ref,
  ...props
}: CardTitleProps) {
  return (
    <h3
      ref={ref}
      style={{ ...style, color: $color ?? "#fff" }}
      className={cn("m-0 text-base font-semibold", className)}
      {...props}
    />
  );
}

type AIBadgeProps = ComponentProps<"span">;

export function AIBadge({ className, ref, ...props }: AIBadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "rounded-xl bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold uppercase",
        className,
      )}
      {...props}
    />
  );
}

type CardContentProps = ComponentProps<"p">;

export function CardContent({ className, ref, ...props }: CardContentProps) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm leading-relaxed text-slate-300", className)}
      {...props}
    />
  );
}

type CardListProps = ComponentProps<"ul">;

export function CardList({ className, ref, ...props }: CardListProps) {
  return (
    <ul
      ref={ref}
      className={cn("m-0 pl-5 text-sm leading-loose text-slate-300", className)}
      {...props}
    />
  );
}
