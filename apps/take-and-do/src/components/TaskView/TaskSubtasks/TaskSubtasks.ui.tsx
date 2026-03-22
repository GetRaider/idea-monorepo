"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/Input";
import { cn } from "@/lib/utils";

type SubtasksSectionProps = ComponentProps<"div">;

export function SubtasksSection({
  className,
  ref,
  ...props
}: SubtasksSectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-6 mb-8 rounded-xl border border-border-app bg-[#1a1a1a]",
        className,
      )}
      {...props}
    />
  );
}

type SubtasksHeaderProps = ComponentProps<"div">;

export function SubtasksHeader({
  className,
  ref,
  ...props
}: SubtasksHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-5 py-4 text-[15px] font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}

type SubtasksHeaderButtonsProps = ComponentProps<"div">;

export function SubtasksHeaderButtons({
  className,
  ref,
  ...props
}: SubtasksHeaderButtonsProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

type SubtasksHeaderButtonProps = ComponentProps<"button">;

export function SubtasksHeaderButton({
  className,
  type = "button",
  ref,
  ...props
}: SubtasksHeaderButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-lg text-[#666] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type SubtasksContainerProps = ComponentProps<"div"> & {
  $isExpanded: boolean;
};

export function SubtasksContainer({
  className,
  $isExpanded,
  ref,
  ...props
}: SubtasksContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("px-3 pb-3", $isExpanded ? "block" : "hidden", className)}
      {...props}
    />
  );
}

type SubtaskItemProps = ComponentProps<"button">;

export function SubtaskItem({
  className,
  type = "button",
  ref,
  ...props
}: SubtaskItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "mb-2 flex w-full cursor-pointer flex-col items-start gap-2 rounded-lg border border-input-border bg-input-bg px-3.5 py-3 text-left transition-all duration-200 last:mb-0 hover:border-[#4a4a4a] hover:bg-[#333]",
        className,
      )}
      {...props}
    />
  );
}

type SubtaskHeaderProps = ComponentProps<"div">;

export function SubtaskHeader({
  className,
  ref,
  ...props
}: SubtaskHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("flex w-full items-center gap-2", className)}
      {...props}
    />
  );
}

type SubtaskKeyProps = ComponentProps<"span">;

export function SubtaskKey({ className, ref, ...props }: SubtaskKeyProps) {
  return (
    <span
      ref={ref}
      className={cn("text-[13px] font-medium text-[#888]", className)}
      {...props}
    />
  );
}

type SubtaskIconProps = ComponentProps<"span">;

export function SubtaskIcon({ className, ref, ...props }: SubtaskIconProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "flex shrink-0 items-center justify-center text-sm leading-none",
        className,
      )}
      {...props}
    />
  );
}

type SubtaskContentProps = ComponentProps<"div">;

export function SubtaskContent({
  className,
  ref,
  ...props
}: SubtaskContentProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "line-clamp-2 overflow-hidden text-ellipsis text-sm leading-snug text-white [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]",
        className,
      )}
      {...props}
    />
  );
}

type SubtaskInputProps = ComponentProps<typeof Input>;

export function SubtaskInput({ className, ref, ...props }: SubtaskInputProps) {
  return <Input ref={ref} className={className} {...props} />;
}

type EmptySubtasksMessageProps = ComponentProps<"div">;

export function EmptySubtasksMessage({
  className,
  ref,
  ...props
}: EmptySubtasksMessageProps) {
  return (
    <div
      ref={ref}
      className={cn("p-2 text-sm text-[#666]", className)}
      {...props}
    />
  );
}
