"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BoardContainerProps = ComponentProps<"div">;

export function BoardContainer({
  className,
  ref,
  ...props
}: BoardContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-screen min-h-screen flex-col bg-gradient-to-br from-[#1a1a1a] to-[#3c2856] supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:min-h-[100dvh]",
        className,
      )}
      {...props}
    />
  );
}

type ToolbarProps = ComponentProps<"div">;

export function Toolbar({ className, ref, ...props }: ToolbarProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-6 py-[18px]",
        className,
      )}
      {...props}
    />
  );
}

type WorkspacePathProps = ComponentProps<"h1">;

export function WorkspacePath({
  className,
  ref,
  ...props
}: WorkspacePathProps) {
  return (
    <h1
      ref={ref}
      className={cn(
        "m-0 flex items-center gap-2 text-lg font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}

type BoardTitleEmojiProps = ComponentProps<"span">;

export function BoardTitleEmoji({
  className,
  ref,
  ...props
}: BoardTitleEmojiProps) {
  return (
    <span
      ref={ref}
      className={cn("shrink-0 text-lg leading-none", className)}
      {...props}
    />
  );
}

type WorkspacePathLeadingProps = ComponentProps<"span">;

export function WorkspacePathLeading({
  className,
  ref,
  ...props
}: WorkspacePathLeadingProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-inherit",
        className,
      )}
      {...props}
    />
  );
}

type ActionsProps = ComponentProps<"div">;

export function Actions({ className, ref, ...props }: ActionsProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  );
}

type SettingsButtonProps = ComponentProps<"button">;

export function SettingsButton({
  className,
  type = "button",
  ref,
  ...props
}: SettingsButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-0 bg-white/10 transition-all duration-200 hover:bg-white/[0.15] [&_img]:h-5 [&_img]:w-5",
        className,
      )}
      {...props}
    />
  );
}

type PopoverContainerProps = ComponentProps<"div">;

export function PopoverContainer({
  className,
  ref,
  ...props
}: PopoverContainerProps) {
  return <div ref={ref} className={cn("relative", className)} {...props} />;
}

type PopoverProps = ComponentProps<"div">;

export function Popover({ className, ref, ...props }: PopoverProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-[50px] z-[200] w-[420px] rounded-xl border border-border-app bg-[#1f1f1f] p-[18px] text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.4)]",
        className,
      )}
      {...props}
    />
  );
}

type RowProps = ComponentProps<"div">;

export function Row({ className, ref, ...props }: RowProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

type SegmentedProps = ComponentProps<"div">;

export function Segmented({ className, ref, ...props }: SegmentedProps) {
  return (
    <div
      ref={ref}
      className={cn("grid grid-cols-2 gap-3", className)}
      {...props}
    />
  );
}

type SegmentBtnProps = ComponentProps<"button"> & {
  $active?: boolean;
};

export function SegmentBtn({
  className,
  type = "button",
  $active,
  ref,
  ...props
}: SegmentBtnProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#333] px-[18px] py-3.5 text-gray-200 transition-colors duration-200 hover:bg-[#2a2a2a]",
        $active ? "bg-[#2a2a2a]" : "bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

type DividerProps = ComponentProps<"hr">;

export function Divider({ className, ref, ...props }: DividerProps) {
  return (
    <hr
      ref={ref}
      className={cn("my-4 h-px border-0 bg-border-app", className)}
      {...props}
    />
  );
}

type LabelProps = ComponentProps<"span">;

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2.5 text-base text-gray-200",
        className,
      )}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select">;

export function Select({ className, ref, ...props }: SelectProps) {
  return (
    <select
      ref={ref}
      className={cn(
        "rounded-[10px] border border-[#333] bg-[#1b1b1b] px-3 py-2.5 text-gray-200",
        className,
      )}
      {...props}
    />
  );
}

type IconBtnProps = ComponentProps<"button">;

export function IconBtn({
  className,
  type = "button",
  ref,
  ...props
}: IconBtnProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-[#333] bg-[#1b1b1b] text-gray-200",
        className,
      )}
      {...props}
    />
  );
}

type FooterProps = ComponentProps<"div">;

export function Footer({ className, ref, ...props }: FooterProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-end pt-2 font-medium text-slate-300",
        className,
      )}
      {...props}
    />
  );
}

type BoardProps = ComponentProps<"div"> & { $fillHeight?: boolean };

export function Board({ className, $fillHeight, ref, ...props }: BoardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid min-h-0 flex-1 grid-cols-3 gap-x-6 gap-y-4 overflow-auto p-6",
        $fillHeight ? "auto-rows-[minmax(0,1fr)]" : "auto-rows-min",
        className,
      )}
      {...props}
    />
  );
}

type BoardMultiLayoutProps = ComponentProps<"div">;

export function BoardMultiLayout({
  className,
  ref,
  ...props
}: BoardMultiLayoutProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-6",
        className,
      )}
      {...props}
    />
  );
}

type MultiBoardSectionProps = ComponentProps<"div">;

export function MultiBoardSection({
  className,
  ref,
  ...props
}: MultiBoardSectionProps) {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 flex-col gap-4", className)}
      {...props}
    />
  );
}

type MultiBoardColumnsGridProps = ComponentProps<"div">;

export function MultiBoardColumnsGrid({
  className,
  ref,
  ...props
}: MultiBoardColumnsGridProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-3 grid-rows-[min-content] gap-x-6 px-4",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceSeparatorProps = ComponentProps<"button"> & {
  children?: ReactNode;
};

export function WorkspaceSeparator({
  className,
  type = "button",
  ref,
  ...props
}: WorkspaceSeparatorProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "col-span-full box-border flex max-h-11 min-h-11 cursor-pointer appearance-none items-center justify-start gap-2 rounded-lg border-0 bg-white/5 px-4 py-3 text-xs font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}

type GroupChevronWrapperProps = ComponentProps<"span"> & {
  $expanded?: boolean;
};

export function GroupChevronWrapper({
  className,
  $expanded,
  ref,
  ...props
}: GroupChevronWrapperProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex transition-transform duration-200 ease-out",
        $expanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...props}
    />
  );
}

type EmptyStateMessageProps = ComponentProps<"div">;

export function EmptyStateMessage({
  className,
  ref,
  ...props
}: EmptyStateMessageProps) {
  return (
    <div
      ref={ref}
      className={cn("col-span-full p-6 text-white", className)}
      {...props}
    />
  );
}

type EmptyStateWrapperProps = ComponentProps<"div">;

export function EmptyStateWrapper({
  className,
  ref,
  ...props
}: EmptyStateWrapperProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "col-span-full flex min-h-[calc(100vh-200px)] items-center justify-center",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceIconProps = ComponentProps<"div">;

export function WorkspaceIcon({
  className,
  ref,
  ...props
}: WorkspaceIconProps) {
  return (
    <div
      ref={ref}
      className={cn("flex h-4 w-4 items-center justify-center", className)}
      {...props}
    />
  );
}

type AddButtonProps = ComponentProps<"button">;

export function AddButton({
  className,
  type = "button",
  ref,
  ...props
}: AddButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-border-app bg-transparent p-3 text-[#666] transition-all duration-200 hover:border-[#3a3a3a] hover:bg-[rgba(42,42,42,0.3)] hover:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

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
        "col-span-full flex min-h-[200px] items-center justify-center px-6 py-12 text-white",
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
        "h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#7255c1] border-r-[#7255c1]",
        className,
      )}
      {...props}
    />
  );
}
