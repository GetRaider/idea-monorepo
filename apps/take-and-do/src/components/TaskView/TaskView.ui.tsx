"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/Input";
import { SecondaryButton } from "@/components/Buttons";
import { cn } from "@/lib/utils";

type TaskViewOverlayProps = ComponentProps<"div">;

export function TaskViewOverlay({
  className,
  ref,
  ...props
}: TaskViewOverlayProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-5 backdrop-blur-sm max-[600px]:p-2.5",
        className,
      )}
      {...props}
    />
  );
}

type TaskViewContainerProps = ComponentProps<"div">;

export function TaskViewContainer({
  className,
  ref,
  ...props
}: TaskViewContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex max-h-[90vh] min-w-0 w-full max-w-[800px] flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-border-app bg-card-bg pb-0 shadow-dialog max-[600px]:max-h-[95vh] max-[600px]:rounded-lg",
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
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border-app px-6 py-[18px] max-[600px]:px-4 max-[600px]:py-3.5",
        className,
      )}
      {...props}
    />
  );
}

type HeaderLeftProps = ComponentProps<"div">;

export function HeaderLeft({ className, ref, ...props }: HeaderLeftProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1 text-base text-[#888]", className)}
      {...props}
    />
  );
}

type StatusIconButtonProps = ComponentProps<"button">;

export function StatusIconButton({
  className,
  type = "button",
  ref,
  ...props
}: StatusIconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1.5 text-[#888] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white [&_svg]:h-[18px] [&_svg]:w-[18px]",
        className,
      )}
      {...props}
    />
  );
}

type HeaderRightProps = ComponentProps<"div">;

export function HeaderRight({ className, ref, ...props }: HeaderRightProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

type DeleteButtonProps = ComponentProps<"button">;

export function DeleteButton({
  className,
  type = "button",
  ref,
  ...props
}: DeleteButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 leading-none text-[#888] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-red-500 [&_svg]:m-0 [&_svg]:block [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

type TaskTitleSectionProps = ComponentProps<"div">;

export function TaskTitleSection({
  className,
  ref,
  ...props
}: TaskTitleSectionProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 items-center gap-3 px-6 pb-4 pt-6",
        className,
      )}
      {...props}
    />
  );
}

type PriorityIconProps = ComponentProps<"button">;

export function PriorityIcon({
  className,
  type = "button",
  ref,
  ...props
}: PriorityIconProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-lg leading-none transition-all duration-200 hover:bg-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

type TaskTitleProps = ComponentProps<"h2">;

export function TaskTitle({ className, ref, ...props }: TaskTitleProps) {
  return (
    <h2
      ref={ref}
      className={cn(
        "m-0 flex-1 cursor-pointer rounded p-1 text-lg font-semibold leading-snug text-white transition-all duration-200 hover:bg-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

type TaskTitleInputProps = ComponentProps<typeof Input>;

export function TaskTitleInput({
  className,
  ref,
  ...props
}: TaskTitleInputProps) {
  return (
    <Input
      ref={ref}
      className={cn(
        "m-0 min-w-0 flex-1 rounded px-2 py-1 text-lg font-semibold leading-snug",
        className,
      )}
      {...props}
    />
  );
}

type TaskDescriptionProps = ComponentProps<"p">;

export function TaskDescription({
  className,
  ref,
  ...props
}: TaskDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn(
        "m-0 cursor-pointer whitespace-pre-wrap rounded px-6 pb-6 text-sm leading-relaxed text-[#888] transition-all duration-200 hover:bg-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

type DescriptionActionsProps = ComponentProps<"div">;

export function DescriptionActions({
  className,
  ref,
  ...props
}: DescriptionActionsProps) {
  return (
    <div
      ref={ref}
      className={cn("mt-3 flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

type SaveButtonProps = ComponentProps<typeof SecondaryButton>;

export function SaveButton({ className, ref, ...props }: SaveButtonProps) {
  return (
    <SecondaryButton
      ref={ref}
      className={cn(
        "rounded-md border-0 bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:border-transparent hover:bg-[#5568d3] active:bg-[#4a5bc4]",
        className,
      )}
      {...props}
    />
  );
}

type TaskDescriptionMarkdownProps = ComponentProps<"div">;

export function TaskDescriptionMarkdown({
  className,
  ref,
  ...props
}: TaskDescriptionMarkdownProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "prose prose-invert prose-sm max-w-none min-h-[100px] max-h-[300px] flex-shrink-0 cursor-pointer overflow-y-auto rounded px-8 py-3 pb-6 text-[#888] transition-all duration-200 hover:bg-[#2a2a2a]",
        "prose-headings:mt-[1.5em] prose-headings:mb-2 prose-headings:font-semibold prose-headings:text-white",
        "prose-h2:text-xl prose-h3:text-lg prose-h4:text-base",
        "prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-ul:pl-6 prose-ol:pl-6 prose-li:my-1",
        "prose-strong:text-white prose-strong:font-semibold prose-em:italic prose-u:underline",
        className,
      )}
      {...props}
    />
  );
}

type StatusSelectorProps = ComponentProps<"div">;

export function StatusSelector({
  className,
  ref,
  ...props
}: StatusSelectorProps) {
  return (
    <div
      ref={ref}
      className={cn("relative inline-block", className)}
      {...props}
    />
  );
}

type StatusButtonProps = ComponentProps<"button">;

export function StatusButton({
  className,
  type = "button",
  ref,
  ...props
}: StatusButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-[#888] transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/20",
        className,
      )}
      {...props}
    />
  );
}

type DropdownContainerProps = ComponentProps<"div"> & {
  $isOpen: boolean;
};

export function DropdownContainer({
  className,
  $isOpen,
  ref,
  ...props
}: DropdownContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-[1001] mt-1 min-w-[150px] rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        $isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  );
}

type DropdownItemProps = ComponentProps<"button">;

export function DropdownItem({
  className,
  type = "button",
  ref,
  ...props
}: DropdownItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left text-sm text-white transition-all duration-200 first:rounded-t-lg last:rounded-b-lg hover:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}

type AttachmentsHeaderProps = ComponentProps<"div">;

export function AttachmentsHeader({
  className,
  ref,
  ...props
}: AttachmentsHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-center justify-between", className)}
      {...props}
    />
  );
}

type AttachButtonProps = ComponentProps<"button">;

export function AttachButton({
  className,
  type = "button",
  ref,
  ...props
}: AttachButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-md border border-input-border bg-input-bg px-3 py-2 text-xs text-[#888] transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#3a3a3a] [&_svg]:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

type AttachmentItemProps = ComponentProps<"button">;

export function AttachmentItem({
  className,
  type = "button",
  ref,
  ...props
}: AttachmentItemProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md border border-input-border bg-input-bg px-3 py-2 text-xs text-[#888] transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}

type AttachmentIconProps = ComponentProps<"span">;

export function AttachmentIcon({
  className,
  ref,
  ...props
}: AttachmentIconProps) {
  return (
    <span
      ref={ref}
      className={cn("flex items-center text-[#888]", className)}
      {...props}
    />
  );
}

type SubtaskCheckboxProps = ComponentProps<"div"> & {
  $completed: boolean;
};

export function SubtaskCheckbox({
  className,
  $completed,
  ref,
  ...props
}: SubtaskCheckboxProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white",
        $completed
          ? "border-green-400 bg-green-400"
          : "border-[#666] bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

type HistorySectionProps = ComponentProps<"div">;

export function HistorySection({
  className,
  ref,
  ...props
}: HistorySectionProps) {
  return <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />;
}

type HistoryHeaderProps = ComponentProps<"div">;

export function HistoryHeader({
  className,
  ref,
  ...props
}: HistoryHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 text-sm font-medium text-white", className)}
      {...props}
    />
  );
}

type CommentInputWrapperProps = ComponentProps<"div">;

export function CommentInputWrapper({
  className,
  ref,
  ...props
}: CommentInputWrapperProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-input-border bg-input-bg p-3",
        className,
      )}
      {...props}
    />
  );
}

type AttachIconButtonProps = ComponentProps<"button">;

export function AttachIconButton({
  className,
  type = "button",
  ref,
  ...props
}: AttachIconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-[#888] transition-all duration-200 hover:bg-[#3a3a3a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type PriorityDropdownWrapperProps = ComponentProps<"div">;

export function PriorityDropdownWrapper({
  className,
  ref,
  ...props
}: PriorityDropdownWrapperProps) {
  return (
    <div ref={ref} className={cn("relative flex", className)} {...props} />
  );
}

type PriorityIconSpanProps = ComponentProps<"span">;

export function PriorityIconSpan({
  className,
  ref,
  ...props
}: PriorityIconSpanProps) {
  return <span ref={ref} className={cn("mr-2", className)} {...props} />;
}

type DescriptionContentProps = ComponentProps<"div">;

export function DescriptionContent({
  className,
  ref,
  ...props
}: DescriptionContentProps) {
  return (
    <div
      ref={ref}
      className={cn("text-sm leading-relaxed text-[#888]", className)}
      {...props}
    />
  );
}

type NoDescriptionTextProps = ComponentProps<"span">;

export function NoDescriptionText({
  className,
  ref,
  ...props
}: NoDescriptionTextProps) {
  return <span ref={ref} className={cn("text-[#666]", className)} {...props} />;
}

type TaskViewFooterProps = ComponentProps<"div">;

export function TaskViewFooter({
  className,
  ref,
  ...props
}: TaskViewFooterProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-end gap-3 border-t border-border-app px-6 pb-6 pt-[22px]",
        className,
      )}
      {...props}
    />
  );
}

type CreateTaskButtonProps = ComponentProps<"button"> & {
  $disabled: boolean;
};

export function CreateTaskButton({
  className,
  type = "button",
  $disabled,
  disabled,
  ref,
  ...props
}: CreateTaskButtonProps) {
  const isDisabled = disabled ?? $disabled;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "rounded-md border-0 px-4 py-2 text-sm font-medium",
        isDisabled
          ? "cursor-not-allowed bg-[#2a2a2a] text-[#666]"
          : "cursor-pointer bg-[#7255c1] text-white",
        className,
      )}
      {...props}
    />
  );
}

type TaskSaveButtonProps = ComponentProps<"button"> & {
  $disabled: boolean;
};

export function TaskSaveButton({
  className,
  type = "button",
  $disabled,
  disabled,
  ref,
  ...props
}: TaskSaveButtonProps) {
  const isDisabled = disabled ?? $disabled;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "rounded-lg border-0 px-5 py-2.5 text-sm font-medium transition-all duration-200",
        isDisabled
          ? "cursor-not-allowed bg-[#2a2a2a] text-[#666]"
          : "cursor-pointer bg-[#7255c1] text-white hover:bg-[#5a42a1]",
        className,
      )}
      {...props}
    />
  );
}
