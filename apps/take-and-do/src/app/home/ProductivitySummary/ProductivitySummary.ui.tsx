"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"div">;

export function Section({ className, ref, ...props }: SectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border-app bg-[#1a1a1a] p-6",
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

type DropdownContainerProps = ComponentProps<"div">;

export function DropdownContainer({
  className,
  ref,
  ...props
}: DropdownContainerProps) {
  return <div ref={ref} className={cn("relative", className)} {...props} />;
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
        "flex cursor-pointer items-center gap-1.5 rounded-md border-0 bg-[#7255c1] px-4 py-2 text-sm font-semibold text-white",
        isDisabled && "cursor-not-allowed opacity-60",
        className,
      )}
      {...props}
    />
  );
}

type DropdownMenuProps = ComponentProps<"div">;

export function DropdownMenu({ className, ref, ...props }: DropdownMenuProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-full z-[1001] mt-1 min-w-[150px] overflow-hidden rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        className,
      )}
      {...props}
    />
  );
}

type DropdownItemProps = ComponentProps<"button"> & {
  $hasBorder?: boolean;
};

export function DropdownItem({
  className,
  type = "button",
  $hasBorder,
  ref,
  ...props
}: DropdownItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "w-full cursor-pointer border-0 bg-transparent px-3 py-2.5 text-left text-sm text-white transition-colors duration-200 hover:bg-[#3a3a3a]",
        $hasBorder && "border-t border-input-border",
        className,
      )}
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

type EmptyStateProps = ComponentProps<"p">;

export function EmptyState({ className, ref, ...props }: EmptyStateProps) {
  return (
    <p ref={ref} className={cn("m-0 text-[#888]", className)} {...props} />
  );
}
