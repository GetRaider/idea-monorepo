"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { Input } from "@/components/Input";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"div">;

export function Section({ className, ref, ...props }: SectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-6 rounded-xl border border-border-app bg-[#1a1a1a] p-6",
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

type DateInputWrapperProps = ComponentProps<"div">;

export function DateInputWrapper({
  className,
  ref,
  ...props
}: DateInputWrapperProps) {
  return (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  );
}

type DateInputProps = ComponentProps<typeof Input>;

export function DateInput({
  className,
  type = "date",
  ref,
  ...props
}: DateInputProps) {
  return (
    <Input
      ref={ref}
      type={type}
      className={cn(
        "w-auto cursor-pointer px-3 py-1.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert",
        className,
      )}
      {...props}
    />
  );
}

type TaskListProps = ComponentProps<"div">;

export function TaskList({ className, ref, ...props }: TaskListProps) {
  return (
    <div ref={ref} className={cn("flex flex-col", className)} {...props} />
  );
}

type TaskListHeaderProps = ComponentProps<"div">;

export function TaskListHeader({
  className,
  ref,
  ...props
}: TaskListHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-1 grid grid-cols-[1fr_120px_100px_80px_100px] gap-3 px-3 py-2",
        className,
      )}
      {...props}
    />
  );
}

type HeaderCellProps = ComponentProps<"span">;

export function HeaderCell({ className, ref, ...props }: HeaderCellProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "text-xs font-semibold tracking-wide text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type TaskItemProps = ComponentProps<"div">;

export function TaskItem({ className, ref, ...props }: TaskItemProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-1.5 grid cursor-pointer grid-cols-[1fr_120px_100px_80px_100px] items-center gap-3 rounded-md bg-input-bg px-3 py-2.5 transition-all duration-200 last:mb-0 hover:bg-[#333]",
        className,
      )}
      {...props}
    />
  );
}

type TaskContentProps = ComponentProps<"div">;

export function TaskContent({ className, ref, ...props }: TaskContentProps) {
  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 items-center gap-2.5", className)}
      {...props}
    />
  );
}

type TaskLeftProps = ComponentProps<"div">;

export function TaskLeft({ className, ref, ...props }: TaskLeftProps) {
  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-1 items-center gap-2.5", className)}
      {...props}
    />
  );
}

type TaskCellProps = ComponentProps<"div">;

export function TaskCell({ className, ref, ...props }: TaskCellProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[#aaa]",
        className,
      )}
      {...props}
    />
  );
}

type TaskCellMutedProps = ComponentProps<"div">;

export function TaskCellMuted({
  className,
  ref,
  ...props
}: TaskCellMutedProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type PriorityIconProps = ComponentProps<"span">;

export function PriorityIcon({ className, ref, ...props }: PriorityIconProps) {
  return (
    <span
      ref={ref}
      className={cn("shrink-0 text-base", className)}
      {...props}
    />
  );
}

type TaskSummaryTextProps = ComponentProps<"span">;

export function TaskSummaryText({
  className,
  ref,
  ...props
}: TaskSummaryTextProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-white",
        className,
      )}
      {...props}
    />
  );
}

type StatusContainerProps = ComponentProps<"div">;

export function StatusContainer({
  className,
  ref,
  ...props
}: StatusContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function statusTone(status: string) {
  if (status === "In Progress") return "text-amber-500";
  if (status === "Done") return "text-emerald-500";
  return "text-[#888]";
}

type StatusProps = ComponentProps<"span"> & { $status: string };

export function StatusIcon({ className, $status, ref, ...props }: StatusProps) {
  return (
    <span
      ref={ref}
      className={cn("text-sm", statusTone($status), className)}
      {...props}
    />
  );
}

export function StatusText({ className, $status, ref, ...props }: StatusProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "whitespace-nowrap text-[11px] font-medium uppercase",
        statusTone($status),
        className,
      )}
      {...props}
    />
  );
}

type ViewAllLinkProps = ComponentProps<typeof Link>;

export function ViewAllLink({ className, href, ...props }: ViewAllLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "mt-3 inline-block text-indigo-500 no-underline hover:underline",
        className,
      )}
      {...props}
    />
  );
}

type ScheduleSelectContainerProps = ComponentProps<"div">;

export function ScheduleSelectContainer({
  className,
  ref,
  ...props
}: ScheduleSelectContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  );
}
