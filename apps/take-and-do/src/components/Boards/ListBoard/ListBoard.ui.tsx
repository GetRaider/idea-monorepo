"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

import { TaskStatus } from "../KanbanBoard/types";

/** Last column fits schedule chip + native date input without hugging the viewport edge. */
const ROW_GRID_COLUMNS =
  "grid-cols-[16px_18px_22px_minmax(0,1fr)_minmax(6.5rem,7.5rem)]";

export function ListBoardRoot({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex min-h-0 w-full flex-1 flex-col gap-2", className)}
      {...props}
    />
  );
}

type ListSectionProps = UiProps<"div"> & {
  /** Renders the active drop ring around the section while dragging over it. */
  isActiveDrop?: boolean;
};

export function ListSection({
  className,
  isActiveDrop,
  ref,
  ...props
}: ListSectionProps) {
  return (
    <section
      ref={ref}
      className={cn(
        "flex w-full min-w-[560px] flex-col border-b border-border-app pb-3 transition-[background-color,box-shadow] duration-150 last:border-b-0 last:pb-0",
        isActiveDrop &&
          "rounded-3xl bg-focus-ring/[0.06] shadow-[inset_0_0_0_2px_var(--focus-ring)]",
        className,
      )}
      {...props}
    />
  );
}

type SectionHeaderProps = UiProps<"button"> & {
  status: TaskStatus;
};

export function SectionHeader({
  className,
  status: _status,
  type = "button",
  ref,
  ...props
}: SectionHeaderProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex cursor-pointer items-center gap-2 self-start rounded-md border-0 bg-transparent px-1 py-2 text-left text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/[0.04]",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeaderTitle({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

type ChevronWrapperProps = UiProps<"span"> & {
  isExpanded?: boolean;
};

export function ChevronWrapper({
  className,
  isExpanded,
  ref,
  ...props
}: ChevronWrapperProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-text-secondary transition-transform duration-200 ease-out",
        isExpanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...props}
    />
  );
}

export function SectionCount({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "rounded-md px-1 text-xs font-medium text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

type SectionBodyProps = UiProps<"div"> & {
  isExpanded?: boolean;
};

export function SectionBody({
  className,
  isExpanded = true,
  ref,
  ...props
}: SectionBodyProps) {
  if (!isExpanded) return null;
  return (
    <div ref={ref} className={cn("flex flex-col", className)} {...props} />
  );
}

export function EmptySectionMessage({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("px-4 py-3 text-xs text-text-tertiary", className)}
      {...props}
    />
  );
}

export function TaskRowOuter({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div ref={ref} className={cn("flex flex-col", className)} {...props} />
  );
}

type TaskRowProps = UiProps<"div"> & {
  isDone?: boolean;
};

export function TaskRow({ className, isDone, ref, ...props }: TaskRowProps) {
  return (
    <div
      ref={ref}
      className={cn(
        // Note: suppress the browser-default (blue) focus outline; keyboard
        // focus is shown via a focus-visible purple ring instead.
        "group/row grid w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-1 py-1.5 text-left text-sm outline-none transition-colors duration-150 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring/70",
        ROW_GRID_COLUMNS,
        isDone ? "text-text-tertiary" : "text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function TaskKey({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "shrink-0 font-mono text-xs font-medium text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

type TaskSummaryProps = UiProps<"span"> & {
  isDone?: boolean;
};

export function TaskSummary({
  className,
  isDone,
  ref,
  ...props
}: TaskSummaryProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "min-w-0 truncate text-sm font-medium",
        isDone
          ? "text-text-tertiary line-through"
          : "text-text-primary no-underline",
        className,
      )}
      {...props}
    />
  );
}

export function TaskMetaCell({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function TaskRowExpandButton({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-text-secondary transition-colors duration-150 hover:bg-white/[0.08] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function PriorityButton({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-base leading-none transition-colors duration-150 hover:bg-white/[0.08]",
        className,
      )}
      {...props}
    />
  );
}

type PriorityDropdownWrapperProps = UiProps<"div">;

export function PriorityDropdownWrapper({
  className,
  ref,
  ...props
}: PriorityDropdownWrapperProps) {
  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
      {...props}
    />
  );
}

export function SubtaskList({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("ml-6 flex flex-col gap-0.5 py-1 pl-2", className)}
      {...props}
    />
  );
}

type SubtaskRowProps = UiProps<"div"> & {
  isDone?: boolean;
};

export function SubtaskRow({
  className,
  isDone,
  ref,
  ...props
}: SubtaskRowProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "group/subtask flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs outline-none transition-colors duration-150 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring/70",
        isDone ? "text-text-tertiary" : "text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function HorizontalScroller({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-x-auto overflow-y-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-[#2a2a2a] hover:[&::-webkit-scrollbar-thumb]:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}
