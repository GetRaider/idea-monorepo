"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/Input";
import { cn } from "@/lib/utils";

type AsideOpenProps = ComponentProps<"aside"> & { $isOpen: boolean };

export function TasksSidebarContainer({
  className,
  $isOpen,
  ref,
  ...props
}: AsideOpenProps) {
  return (
    <aside
      ref={ref}
      className={cn(
        "fixed left-[60px] top-0 z-[90] flex h-screen w-[220px] flex-col gap-6 border-r border-border-app bg-card-bg p-4 transition-transform duration-300 ease-out",
        $isOpen ? "translate-x-0" : "-translate-x-full",
        className,
      )}
      {...props}
    />
  );
}

type SearchProps = ComponentProps<"div">;

export function Search({ className, ref, ...props }: SearchProps) {
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

type NavItemProps = ComponentProps<"button"> & {
  $active?: boolean;
};

export function NavItem({
  className,
  type = "button",
  $active,
  ref,
  ...props
}: NavItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border-0 px-3 py-2 text-left text-sm transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        $active
          ? "cursor-default bg-[#2a2a2a] text-white"
          : "cursor-pointer bg-transparent text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceContainerProps = ComponentProps<"div"> & {
  $grow?: boolean;
};

export function WorkspaceContainer({
  className,
  $grow,
  ref,
  ...props
}: WorkspaceContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2",
        $grow && "min-h-0 flex-1",
        className,
      )}
      {...props}
    />
  );
}

type SideBarSectionHeaderProps = ComponentProps<"div">;

export function SideBarSectionHeader({
  className,
  ref,
  ...props
}: SideBarSectionHeaderProps) {
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
        "flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[#666] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceListProps = ComponentProps<"div"> & {
  $isDragOver?: boolean;
};

export function WorkspaceList({
  className,
  $isDragOver,
  ref,
  ...props
}: WorkspaceListProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-[120px] flex-1 flex-col gap-1 rounded-lg border border-dashed py-0.5 transition-[border-color,background] duration-150",
        $isDragOver
          ? "border-[#7255c1] bg-[rgba(114,85,193,0.12)]"
          : "border-transparent bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceItemProps = ComponentProps<"div">;

export function WorkspaceItem({
  className,
  ref,
  ...props
}: WorkspaceItemProps) {
  return (
    <div ref={ref} className={cn("flex flex-col", className)} {...props} />
  );
}

type WorkspaceToggleProps = ComponentProps<"button">;

export function WorkspaceToggle({
  className,
  type = "button",
  ref,
  ...props
}: WorkspaceToggleProps) {
  return (
    <button
      ref={ref}
      type={type}
      data-workspace-toggle
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm text-[#888] transition-[background,color] duration-150 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type BoardToggleProps = ComponentProps<"button">;

export function BoardToggle({
  className,
  type = "button",
  ref,
  ...props
}: BoardToggleProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm text-[#888] transition-colors duration-200",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceRowActionsProps = ComponentProps<"div">;

export function WorkspaceRowActions({
  className,
  ref,
  ...props
}: WorkspaceRowActionsProps) {
  return (
    <div
      ref={ref}
      data-workspace-row-actions
      className={cn(
        "inline-flex shrink-0 items-center justify-center self-center py-0 pl-0 pr-2 text-[#888] opacity-0 transition-opacity duration-150 group-hover/board-row:opacity-100 group-hover/folder-row:opacity-100 [&_[data-board-actions-trigger]]:inline-flex [&_[data-board-actions-trigger]]:items-center [&_[data-board-actions-trigger]]:justify-center [&_[data-board-actions-trigger]]:rounded [&_[data-board-actions-trigger]]:p-1 [&_[data-folder-actions-trigger]]:inline-flex [&_[data-folder-actions-trigger]]:items-center [&_[data-folder-actions-trigger]]:justify-center [&_[data-folder-actions-trigger]]:rounded [&_[data-folder-actions-trigger]]:p-1",
        className,
      )}
      {...props}
    />
  );
}

type BoardRowProps = ComponentProps<"div"> & {
  $active?: boolean;
  $selected?: boolean;
};

export function BoardRow({
  className,
  $active,
  $selected,
  ref,
  ...props
}: BoardRowProps) {
  const highlighted = $active || $selected;
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

type BoardNameInputProps = ComponentProps<typeof Input>;

export function BoardNameInput({
  className,
  ref,
  ...props
}: BoardNameInputProps) {
  return (
    <Input
      ref={ref}
      className={cn(
        "h-auto min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm leading-snug focus:border-input-border focus:bg-input-bg",
        className,
      )}
      {...props}
    />
  );
}

type BoardEditWrapProps = ComponentProps<"div">;

export function BoardEditWrap({
  className,
  ref,
  ...props
}: BoardEditWrapProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 px-3 py-2",
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

type EmojiPickerHolderProps = ComponentProps<"div">;

export function EmojiPickerHolder({
  className,
  ref,
  ...props
}: EmojiPickerHolderProps) {
  return (
    <div
      ref={ref}
      className={cn("relative flex shrink-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

type EmojiButtonProps = ComponentProps<"button"> & {
  $hasEmoji?: boolean;
};

export function EmojiButton({
  className,
  type = "button",
  $hasEmoji,
  ref,
  ...props
}: EmojiButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-input-border bg-input-bg transition-[background,border-color,color] duration-150 hover:border-[#4a4a4a] hover:bg-[#2f2f2f] hover:text-white",
        $hasEmoji ? "text-white" : "text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type EmojiPreviewProps = ComponentProps<"span">;

export function EmojiPreview({ className, ref, ...props }: EmojiPreviewProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center text-base leading-none",
        className,
      )}
      {...props}
    />
  );
}

type EmojiPickerPopoverProps = ComponentProps<"div">;

export function EmojiPickerPopover({
  className,
  ref,
  ...props
}: EmojiPickerPopoverProps) {
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

type EmojiClearButtonProps = ComponentProps<"button">;

export function EmojiClearButton({
  className,
  type = "button",
  ref,
  ...props
}: EmojiClearButtonProps) {
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

type ChevronExpandedProps = ComponentProps<"span"> & {
  $expanded?: boolean;
};

export function ChevronWrapper({
  className,
  $expanded,
  ref,
  ...props
}: ChevronExpandedProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "ml-auto inline-flex transition-transform duration-200",
        $expanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...props}
    />
  );
}

export function FolderChevron({
  className,
  $expanded,
  ref,
  ...props
}: ChevronExpandedProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-inherit opacity-70 transition-transform duration-200 ease-out",
        $expanded ? "rotate-90" : "rotate-0",
        className,
      )}
      {...props}
    />
  );
}

type SubItemsProps = ComponentProps<"div">;

export function SubItems({ className, ref, ...props }: SubItemsProps) {
  return (
    <div
      ref={ref}
      className={cn("ml-6 mt-1 flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

type SubItemProps = ComponentProps<"div">;

export function SubItem({ className, ref, ...props }: SubItemProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-[#888] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type FolderNameInputProps = ComponentProps<typeof Input>;

export function FolderNameInput({
  className,
  ref,
  ...props
}: FolderNameInputProps) {
  return (
    <Input
      ref={ref}
      data-folder-name-input
      className={cn(
        "h-auto min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm leading-snug focus:border-input-border focus:bg-input-bg",
        className,
      )}
      {...props}
    />
  );
}

type FolderEditWrapProps = ComponentProps<"div">;

export function FolderEditWrap({
  className,
  ref,
  ...props
}: FolderEditWrapProps) {
  return (
    <div
      ref={ref}
      data-folder-edit-wrap
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 px-3 py-2",
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

type FolderRowProps = ComponentProps<"div"> & { $active?: boolean };

export function FolderRow({
  className,
  $active,
  ref,
  ...props
}: FolderRowProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "group/folder-row flex w-full items-center rounded-lg transition-colors duration-150 hover:bg-[#2a2a2a] [&:hover_[data-workspace-toggle]]:text-white",
        $active && "[&_[data-workspace-row-actions]]:opacity-100",
        "[&_[data-folder-edit-wrap]]:min-w-0 [&_[data-folder-edit-wrap]]:flex-1",
        "[&_[data-folder-name-input]]:min-w-0 [&_[data-folder-name-input]]:flex-1",
        "[&_[data-workspace-toggle]]:flex-1",
        className,
      )}
      {...props}
    />
  );
}

type FolderDropTargetProps = ComponentProps<"div"> & {
  $isDragOver?: boolean;
};

export function FolderDropTarget({
  className,
  $isDragOver,
  ref,
  ...props
}: FolderDropTargetProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border transition-[border-color,background] duration-150 hover:[&_[data-workspace-toggle]]:bg-[#2a2a2a] hover:[&_[data-workspace-toggle]]:text-white",
        $isDragOver
          ? "border-[#7255c1] bg-[rgba(114,85,193,0.15)]"
          : "border-transparent bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

type RootBoardsDropZoneProps = ComponentProps<"div">;

export function RootBoardsDropZone({
  className,
  ref,
  ...props
}: RootBoardsDropZoneProps) {
  return (
    <div
      ref={ref}
      className={cn("flex min-h-0 flex-col gap-1", className)}
      {...props}
    />
  );
}
