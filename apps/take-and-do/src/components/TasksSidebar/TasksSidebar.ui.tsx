"use client";

import type { ComponentProps } from "react";

import { ChevronRightIcon } from "@/components/Icons";
import { Input } from "@/components/Input";
import { TASKS_SIDEBAR_MAX_WIDTH_PX } from "@/helpers/tasks-sidebar-layout";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

type TasksSidebarPanelProps = UiProps<"aside">;

export function TasksSidebarContainer({
  className,
  ref,
  style,
  ...props
}: TasksSidebarPanelProps) {
  return (
    <aside
      ref={ref}
      id="take-and-do-tasks-sidebar"
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: TASKS_SIDEBAR_MAX_WIDTH_PX,
        ...style,
      }}
      className={cn(
        "relative z-0 flex min-h-0 w-full max-w-full flex-1 flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border border-white/[0.06] bg-sidebar-bg p-3.5 max-[900px]:max-w-none",
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
        "flex items-center gap-2 rounded-lg border border-input-border bg-input-bg px-2 py-px text-text-secondary",
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
        "flex-1 border-0 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary",
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
        "flex w-full min-w-0 items-center gap-3 rounded-lg border-0 px-3 py-2 text-left text-sm transition-all duration-200 hover:bg-[#1a1a1a] hover:text-text-primary",
        isActive
          ? "cursor-default bg-surface-active text-text-primary"
          : "cursor-pointer bg-transparent text-text-secondary",
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

export const TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS =
  "text-sm font-extrabold tracking-wide text-text-tertiary";

export function SideBarSectionHeader({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between",
        TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS,
        className,
      )}
      {...props}
    />
  );
}

export function SidebarCollapsibleSectionHeader({
  isExpanded,
  onToggle,
  title,
  className,
  ref,
}: UiProps<"button"> & {
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "flex min-w-0 items-center gap-1 rounded-lg border-0 bg-transparent py-1 pl-0 pr-1 text-left transition-colors hover:bg-white/[0.04]",
        className,
      )}
    >
      <FolderChevron isExpanded={isExpanded}>
        <ChevronRightIcon size={11} />
      </FolderChevron>
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS,
        )}
      >
        {title}
      </span>
    </button>
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
        "flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-text-tertiary transition-all duration-200 hover:bg-[#1a1a1a] hover:text-text-primary",
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
        "flex flex-1 flex-col gap-1 rounded-lg border border-dashed transition-[border-color,background-color,box-shadow] duration-150",
        isDragOver
          ? "border-white/30 bg-[rgba(255,255,255,0.08)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]"
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
        "flex w-full min-w-0 cursor-pointer items-center gap-0 rounded-lg border-0 bg-transparent py-1.5 pl-1 pr-3 text-left text-sm leading-5 text-text-secondary transition-[background,color] duration-150 hover:bg-[#1a1a1a] hover:text-text-primary",
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
        "flex min-w-0 flex-1 cursor-pointer items-center gap-0 rounded-lg border-0 bg-transparent py-1.5 pl-1 pr-3 text-left text-sm leading-5 text-text-secondary transition-colors duration-200",
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
        "inline-flex shrink-0 items-center justify-center py-0 pl-0 pr-2 text-text-secondary opacity-0 transition-opacity duration-150 group-hover/board-row:opacity-100 group-hover/folder-row:opacity-100 [&_[data-board-actions-trigger]]:inline-flex [&_[data-board-actions-trigger]]:items-center [&_[data-board-actions-trigger]]:justify-center [&_[data-board-actions-trigger]]:rounded [&_[data-board-actions-trigger]]:p-1 [&_[data-folder-actions-trigger]]:inline-flex [&_[data-folder-actions-trigger]]:items-center [&_[data-folder-actions-trigger]]:justify-center [&_[data-folder-actions-trigger]]:rounded [&_[data-folder-actions-trigger]]:p-1",
        className,
      )}
      {...props}
    />
  );
}

type BoardRowProps = UiProps<"div"> & {
  isActive?: boolean;
  isSelected?: boolean;
  /** In-folder reorder: full row tint (column-like). */
  isDropSlotActive?: boolean;
  /** Root list reorder: insertion line only (avoids “drop into board” misread). */
  showDropInsertLine?: boolean;
};

export function BoardRow({
  className,
  isActive,
  isSelected,
  isDropSlotActive,
  showDropInsertLine,
  ref,
  children,
  ...props
}: BoardRowProps) {
  const highlighted = isActive || isSelected;
  return (
    <div
      ref={ref}
      className={cn(
        "group/board-row relative flex w-full min-h-[36px] items-center rounded-xl transition-[background-color,box-shadow] duration-150 hover:bg-[#1a1a1a]",
        highlighted ? "bg-surface-active" : "bg-transparent",
        highlighted && "[&_[data-workspace-row-actions]]:opacity-100",
        highlighted && "[&_button]:text-text-primary",
        "hover:[&_button]:text-text-primary",
        "[&[data-selected]_button]:cursor-default",
        isDropSlotActive &&
          "z-[1] bg-[rgba(255,255,255,0.08)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]",
        className,
      )}
      {...props}
    >
      {showDropInsertLine ? (
        <span
          className="pointer-events-none absolute inset-x-2 top-0 z-[1] h-0.5 rounded-full bg-white/70 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
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
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-input-border bg-input-bg transition-[background,border-color,color] duration-150 hover:border-input-border-hover hover:bg-[#1f1f1f] hover:text-text-primary",
        hasEmoji ? "text-text-primary" : "text-text-secondary",
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
        "absolute left-0 top-[34px] z-[200] w-80 overflow-hidden rounded-[10px] border border-border-app bg-background-primary shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
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
        "w-full cursor-pointer border-0 border-t border-border-app bg-transparent px-3 py-2.5 text-text-secondary hover:bg-[#1a1a1a] hover:text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

type ChevronExpandedProps = UiProps<"span"> & {
  isExpanded?: boolean;
  /** Skip rotation transition (e.g. empty folder — no content height change to pair with). */
  instant?: boolean;
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
  instant,
  ref,
  ...props
}: ChevronExpandedProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-start text-text-secondary",
        instant
          ? "transition-none"
          : "transition-transform duration-200 ease-out",
        SIDEBAR_TREE_LEADING_SLOT_CLASS,
        isExpanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...props}
    />
  );
}

export function SubItems({
  className,
  isDropActive,
  ref,
  ...props
}: UiProps<"div"> & { isDropActive?: boolean }) {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-0.5 flex min-h-0 flex-col gap-1 rounded-r-xl py-0.5 pl-2 transition-[background-color,box-shadow] duration-150",
        isDropActive &&
          "bg-[rgba(255,255,255,0.08)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]",
        className,
      )}
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
        "group/folder-row flex w-full items-center rounded-lg transition-colors duration-150 hover:bg-[#1a1a1a] [&:hover_[data-workspace-toggle]]:text-text-primary",
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
        "flex min-h-0 w-full min-w-0 flex-col gap-0 rounded-xl transition-[background-color,box-shadow] duration-150",
        isDragOver &&
          "bg-[rgba(255,255,255,0.1)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
