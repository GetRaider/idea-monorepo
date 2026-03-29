"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/Input";
import {
  TASKS_SIDEBAR_MAX_WIDTH_PX,
  TASKS_SIDEBAR_MIN_WIDTH_PX,
} from "@/helpers/tasks-sidebar-layout";
import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

type AsideOpenProps = UiProps<"aside"> & {
  isOpen: boolean;
  widthPx: number;
};

export function TasksSidebarContainer({
  className,
  isOpen,
  widthPx,
  ref,
  style,
  ...props
}: AsideOpenProps) {
  return (
    <aside
      ref={ref}
      style={{
        width: widthPx,
        minWidth: TASKS_SIDEBAR_MIN_WIDTH_PX,
        maxWidth: TASKS_SIDEBAR_MAX_WIDTH_PX,
        ...style,
      }}
      className={cn(
        "fixed left-[60px] top-0 z-[90] flex h-screen flex-col gap-6 overflow-visible border-r border-border-app bg-card-bg p-4 transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className,
      )}
      {...props}
    />
  );
}

export function Search({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-input-border bg-input-bg px-2 py-px text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type SearchInputProps = ComponentProps<typeof Input>;

export function SearchInput({
  className,
  maxLength = 64,
  ref,
  ...props
}: SearchInputProps) {
  return (
    <Input
      ref={ref}
      maxLength={maxLength}
      className={cn(
        "flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type NavItemProps = UiProps<"button"> & {
  isActive?: boolean;
};

export function NavItem({
  className,
  type = "button",
  isActive,
  ref,
  ...props
}: NavItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-lg border-0 px-3 py-2 text-left text-sm transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        isActive
          ? "cursor-default bg-[#2a2a2a] text-white"
          : "cursor-pointer bg-transparent text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceContainerProps = UiProps<"div"> & {
  grow?: boolean;
};

export function WorkspaceContainer({
  className,
  grow,
  ref,
  ...props
}: WorkspaceContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2", grow && "min-h-0 flex-1", className)}
      {...props}
    />
  );
}

export function SideBarSectionHeader({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between text-sm font-extrabold tracking-wide text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

export function AddButton({
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
        "flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[#666] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceListProps = UiProps<"div"> & {
  isDragOver?: boolean;
};

export function WorkspaceList({
  className,
  isDragOver,
  ref,
  ...props
}: WorkspaceListProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-1 flex-col gap-2 rounded-lg border border-dashed transition-[border-color,background] duration-150",
        isDragOver
          ? "border-[#7255c1] bg-[rgba(114,85,193,0.12)]"
          : "border-transparent bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function WorkspaceItem({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div ref={ref} className={cn("flex flex-col", className)} {...props} />
  );
}

export function WorkspaceToggle({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      data-workspace-toggle
      className={cn(
        "flex w-full min-w-0 cursor-pointer items-center gap-0 rounded-lg border-0 bg-transparent py-1.5 pl-1 pr-3 text-left text-sm leading-5 text-[#888] transition-[background,color] duration-150 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function BoardToggle({
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
        "flex min-w-0 flex-1 cursor-pointer items-center gap-0 rounded-lg border-0 bg-transparent py-1.5 pl-1 pr-3 text-left text-sm leading-5 text-[#888] transition-colors duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function WorkspaceRowActions({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      data-workspace-row-actions
      className={cn(
        "inline-flex shrink-0 items-center justify-center py-0 pl-0 pr-2 text-[#888] opacity-0 transition-opacity duration-150 group-hover/board-row:opacity-100 group-hover/folder-row:opacity-100 [&_[data-board-actions-trigger]]:inline-flex [&_[data-board-actions-trigger]]:items-center [&_[data-board-actions-trigger]]:justify-center [&_[data-board-actions-trigger]]:rounded [&_[data-board-actions-trigger]]:p-1 [&_[data-folder-actions-trigger]]:inline-flex [&_[data-folder-actions-trigger]]:items-center [&_[data-folder-actions-trigger]]:justify-center [&_[data-folder-actions-trigger]]:rounded [&_[data-folder-actions-trigger]]:p-1",
        className,
      )}
      {...props}
    />
  );
}

type BoardRowProps = UiProps<"div"> & {
  isActive?: boolean;
  isSelected?: boolean;
};

export function BoardRow({
  className,
  isActive,
  isSelected,
  ref,
  ...props
}: BoardRowProps) {
  const highlighted = isActive || isSelected;
  return (
    <div
      ref={ref}
      className={cn(
        "group/board-row relative flex items-center rounded-lg transition-colors duration-150 hover:bg-[#2a2a2a]",
        highlighted ? "bg-[#2a2a2a]" : "bg-transparent",
        highlighted && "[&_[data-workspace-row-actions]]:opacity-100",
        highlighted && "[&_button]:text-white",
        "hover:[&_button]:text-white",
        "[&[data-selected]_button]:cursor-default",
        className,
      )}
      {...props}
    />
  );
}

export function BoardEditWrap({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-0 py-1.5 pl-1 pr-3",
        className,
      )}
      {...props}
    />
  );
}

type BoardEditInputProps = ComponentProps<typeof Input>;

export function BoardEditInput({
  className,
  ref,
  ...props
}: BoardEditInputProps) {
  return (
    <Input
      ref={ref}
      className={cn(
        "h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-snug focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function EmojiPickerHolder({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("relative flex shrink-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

type EmojiButtonProps = UiProps<"button"> & {
  hasEmoji?: boolean;
};

export function EmojiButton({
  className,
  type = "button",
  hasEmoji,
  ref,
  ...props
}: EmojiButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-input-border bg-input-bg transition-[background,border-color,color] duration-150 hover:border-[#4a4a4a] hover:bg-[#2f2f2f] hover:text-white",
        hasEmoji ? "text-white" : "text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

export function EmojiPreview({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center text-[15px] leading-none",
        className,
      )}
      {...props}
    />
  );
}

export function EmojiPickerPopover({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-[34px] z-[200] w-80 overflow-hidden rounded-[10px] border border-border-app bg-card-bg shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    />
  );
}

export function EmojiClearButton({
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
        "w-full cursor-pointer border-0 border-t border-border-app bg-transparent px-3 py-2.5 text-[#888] hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type ChevronExpandedProps = UiProps<"span"> & {
  isExpanded?: boolean;
};

/** Same width as FolderChevron so icons align with folder rows (narrower than w-5 = icon closer to chevron). */
const SIDEBAR_TREE_LEADING_SLOT_CLASS = "h-5 w-3.5 shrink-0";

/** Fixed-width slot so folder/board emoji columns line up when only folders use a chevron. */
export function SidebarChevronGutter({
  className,
  ref,
  ...props
}: UiProps<"span">) {
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center",
        SIDEBAR_TREE_LEADING_SLOT_CLASS,
        className,
      )}
      {...props}
    />
  );
}

export function FolderChevron({
  className,
  isExpanded,
  ref,
  ...props
}: ChevronExpandedProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-start text-[#888] transition-transform duration-200 ease-out",
        SIDEBAR_TREE_LEADING_SLOT_CLASS,
        isExpanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...props}
    />
  );
}

export function SubItems({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mt-0.5 flex flex-col gap-0 pl-2.5", className)}
      {...props}
    />
  );
}

export function FolderEditWrap({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      data-folder-edit-wrap
      className={cn(
        "flex min-w-0 flex-1 items-center gap-0 py-1.5 pl-1 pr-3",
        className,
      )}
      {...props}
    />
  );
}

type FolderEditInputProps = ComponentProps<typeof Input>;

export function FolderEditInput({
  className,
  ref,
  ...props
}: FolderEditInputProps) {
  return (
    <Input
      ref={ref}
      className={cn(
        "h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-snug focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

type FolderRowProps = UiProps<"div"> & { isActive?: boolean };

export function FolderRow({
  className,
  isActive,
  ref,
  ...props
}: FolderRowProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "group/folder-row flex w-full items-center rounded-lg transition-colors duration-150 hover:bg-[#2a2a2a] [&:hover_[data-workspace-toggle]]:text-white",
        isActive && "[&_[data-workspace-row-actions]]:opacity-100",
        "[&_[data-folder-edit-wrap]]:min-w-0 [&_[data-folder-edit-wrap]]:flex-1",
        "[&_[data-folder-name-input]]:min-w-0 [&_[data-folder-name-input]]:flex-1",
        "[&_[data-workspace-toggle]]:flex-1",
        className,
      )}
      {...props}
    />
  );
}

type FolderDropTargetProps = UiProps<"div"> & {
  isDragOver?: boolean;
};

export function FolderDropTarget({
  className,
  isDragOver,
  ref,
  ...props
}: FolderDropTargetProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border transition-[border-color,background] duration-150 hover:[&_[data-workspace-toggle]]:bg-[#2a2a2a] hover:[&_[data-workspace-toggle]]:text-white",
        isDragOver
          ? "border-[#7255c1] bg-[rgba(114,85,193,0.15)]"
          : "border-transparent bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function RootBoardsDropZone({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex min-h-0 flex-col gap-1", className)}
      {...props}
    />
  );
}
