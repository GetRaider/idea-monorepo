"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type BreadcrumbsRowProps = ComponentProps<"div">;

export function BreadcrumbsRow({
  className,
  ref,
  ...props
}: BreadcrumbsRowProps) {
  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

type BreadcrumbChevronProps = ComponentProps<typeof Image>;

export function BreadcrumbChevron({
  className,
  width = 14,
  height = 14,
  alt = "",
  ...props
}: BreadcrumbChevronProps) {
  return (
    <Image
      alt={alt}
      width={width}
      height={height}
      className={cn("mx-1 block h-3.5 w-3.5 shrink-0", className)}
      {...props}
    />
  );
}

type BoardTriggerProps = ComponentProps<"button">;

export function BoardTrigger({
  className,
  type = "button",
  ref,
  ...props
}: BoardTriggerProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "m-0 max-w-[200px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-0 bg-transparent px-1.5 py-1 font-inherit text-base text-[#888] transition-colors hover:bg-[#2a2a2a] hover:text-white disabled:cursor-default disabled:opacity-70 hover:disabled:bg-transparent hover:disabled:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type BoardDropdownWrapProps = ComponentProps<"div">;

export function BoardDropdownWrap({
  className,
  ref,
  ...props
}: BoardDropdownWrapProps) {
  return (
    <div
      ref={ref}
      className={cn("relative flex min-w-0 items-center", className)}
      {...props}
    />
  );
}

type BoardDropdownPanelProps = ComponentProps<"div"> & {
  $isOpen: boolean;
};

export function BoardDropdownPanel({
  className,
  $isOpen,
  ref,
  ...props
}: BoardDropdownPanelProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-[1001] mt-1 max-h-60 min-w-[180px] overflow-y-auto rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        $isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  );
}

type BoardDropdownItemProps = ComponentProps<"button">;

export function BoardDropdownItem({
  className,
  type = "button",
  ref,
  ...props
}: BoardDropdownItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left text-sm text-white transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg hover:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}

type ParentTaskButtonProps = ComponentProps<"button">;

export function ParentTaskButton({
  className,
  type = "button",
  ref,
  ...props
}: ParentTaskButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "m-0 cursor-pointer rounded-md border-0 bg-transparent px-1.5 py-1 font-inherit text-base text-[#888] hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type StatusDropdownWrapProps = ComponentProps<"div">;

export function StatusDropdownWrap({
  className,
  ref,
  ...props
}: StatusDropdownWrapProps) {
  return (
    <div
      ref={ref}
      className={cn("relative flex items-center", className)}
      {...props}
    />
  );
}

type TaskKeyTextProps = ComponentProps<"span">;

export function TaskKeyText({ className, ref, ...props }: TaskKeyTextProps) {
  return (
    <span
      ref={ref}
      className={cn("ml-1 text-base text-[#888]", className)}
      {...props}
    />
  );
}
