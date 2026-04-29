"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/Input";
import { SecondaryButton } from "@/components/Buttons";
import { MenuRowButton } from "@/components/MenuRowButton/MenuRowButton";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function TaskViewOverlay({ className, ref, ...props }: UiProps<"div">) {
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

export function TaskViewContainer({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex max-h-[92vh] min-h-[70vh] min-w-0 w-full max-w-[960px] flex-col overflow-x-hidden overflow-y-visible rounded-xl border border-border-app bg-background-primary pb-0 shadow-dialog max-[600px]:max-h-[95vh] max-[600px]:min-h-[75vh] max-[600px]:rounded-lg",
        className,
      )}
      {...props}
    />
  );
}

export function TaskViewDialogHeader({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border-app px-6 py-2.5 max-[600px]:px-4 max-[600px]:py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export function HeaderLeft({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-sm text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

export function StatusIconButton({
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
        "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1.5 text-[#888] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 [&_svg]:h-[17px] [&_svg]:w-[17px]",
        className,
      )}
      {...props}
    />
  );
}

export function HeaderRight({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

export function DeleteButton({
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
        "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 leading-none text-[#888] transition-colors duration-150 hover:bg-white/[0.06] hover:text-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 [&_svg]:m-0 [&_svg]:block [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function TaskTitleSection({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "group/title flex min-w-0 items-start gap-1 px-6 pb-3 pt-6",
        className,
      )}
      {...props}
    />
  );
}

export function PriorityIcon({
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
        "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-lg leading-none transition-all duration-200 hover:bg-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

export function TaskTitle({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn(
        "m-0 box-border flex-1 cursor-pointer rounded-md border border-transparent px-2 py-1 text-xl font-semibold leading-snug text-white transition-colors duration-150 hover:bg-white/[0.04]",
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
        "m-0 min-w-0 flex-1 rounded-md border-transparent bg-transparent px-2 py-1 text-xl font-semibold leading-snug text-white focus:border-input-border",
        className,
      )}
      {...props}
    />
  );
}

export function TaskDescription({ className, ref, ...props }: UiProps<"p">) {
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

export function DescriptionActions({
  className,
  ref,
  ...props
}: UiProps<"div">) {
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

export function TaskDescriptionMarkdown({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "task-view-description box-border max-w-none min-h-[140px] cursor-pointer overflow-y-auto rounded-md px-6 py-3 text-white transition-colors duration-150 hover:bg-white/[0.04]",
        className,
      )}
      {...props}
    />
  );
}

export function StatusSelector({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("relative inline-block", className)}
      {...props}
    />
  );
}

export function StatusButton({
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
        "flex cursor-pointer items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-[#888] transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/20",
        className,
      )}
      {...props}
    />
  );
}

type DropdownContainerProps = UiProps<"div"> & {
  isOpen: boolean;
};

export function DropdownContainer({
  className,
  isOpen,
  ref,
  ...props
}: DropdownContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-[1200] mt-1.5 min-w-[180px] rounded-xl border border-white/10 bg-background-primary shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
        isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownItem({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <MenuRowButton
      ref={ref}
      type={type}
      rowTransition="colors"
      className={cn(
        "py-2 text-[#ddd] hover:bg-white/[0.07] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function AttachmentsHeader({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function AttachButton({
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
        "flex cursor-pointer items-center gap-1.5 rounded-md border border-input-border bg-input-bg px-3 py-2 text-xs text-[#888] transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#3a3a3a] [&_svg]:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

export function AttachmentItem({
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
        "flex cursor-pointer items-center gap-2 rounded-md border border-input-border bg-input-bg px-3 py-2 text-xs text-[#888] transition-all duration-200 hover:border-[#4a4a4a] hover:bg-[#3a3a3a]",
        className,
      )}
      {...props}
    />
  );
}

export function AttachmentIcon({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn("flex items-center text-[#888]", className)}
      {...props}
    />
  );
}

type SubtaskCheckboxProps = UiProps<"div"> & {
  isCompleted: boolean;
};

export function SubtaskCheckbox({
  className,
  isCompleted,
  ref,
  ...props
}: SubtaskCheckboxProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white",
        isCompleted
          ? "border-green-400 bg-green-400"
          : "border-[#666] bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function HistorySection({ className, ref, ...props }: UiProps<"div">) {
  return <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />;
}

export function HistoryHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 text-sm font-medium text-white", className)}
      {...props}
    />
  );
}

export function AttachIconButton({
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
        "flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-[#888] transition-all duration-200 hover:bg-[#3a3a3a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function PriorityDropdownWrapper({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div ref={ref} className={cn("relative flex", className)} {...props} />
  );
}

export function PriorityIconSpan({
  className,
  ref,
  ...props
}: UiProps<"span">) {
  return <span ref={ref} className={cn("mr-2", className)} {...props} />;
}

export function DescriptionContent({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return <div ref={ref} className={cn("contents", className)} {...props} />;
}

export function NoDescriptionText({
  className,
  ref,
  ...props
}: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "block text-sm font-normal not-italic leading-[1.6] text-text-tertiary",
        className,
      )}
      {...props}
    />
  );
}

export function TaskViewBody({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-[5] flex min-h-0 flex-1 flex-row max-[600px]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

export function TaskViewLeftPanel({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-1 flex-col overflow-y-auto", className)}
      {...props}
    />
  );
}

export function TaskViewRightPanel({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "w-[260px] shrink-0 border-l border-border-app bg-white/[0.015] max-[600px]:w-full max-[600px]:border-l-0 max-[600px]:border-t",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarPropertyRow({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarPropertyLabel({
  className,
  ref,
  ...props
}: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "w-[72px] shrink-0 text-[10px] font-semibold tracking-wider text-[#4a4a4a] uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarPropertyValue({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 flex-1 flex-wrap items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarValueButton({
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
        "flex min-h-[32px] min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-[#bbb] transition-colors duration-150 hover:border-white/10 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15",
        className,
      )}
      {...props}
    />
  );
}

export function CommentSection({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("border-t border-border-app/50 px-6 py-4", className)}
      {...props}
    />
  );
}

export function CommentInputRow({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-start gap-3", className)}
      {...props}
    />
  );
}

export function CommentAvatar({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a] text-[11px] text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

export function CommentInputWrapper({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col gap-2", className)}
      {...props}
    />
  );
}

export function CommentTextInput({
  className,
  ref,
  ...props
}: UiProps<"textarea">) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[60px] w-full resize-none rounded-lg border border-input-border bg-transparent px-3 py-2 text-sm text-[#aaa] outline-none placeholder:text-[#555] focus:border-[#4a4a4a] focus:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function CommentSubmitRow({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between", className)}
      {...props}
    />
  );
}

export function CommentAttachButton({
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
        "flex cursor-pointer items-center gap-1.5 rounded border-0 bg-transparent p-1 text-[#555] transition-colors duration-150 hover:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

export function CommentSubmitButton({
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
        "cursor-pointer rounded-md border border-input-border bg-transparent px-3 py-1.5 text-xs font-medium text-[#888] transition-all duration-150 hover:border-[#4a4a4a] hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function TitleActions({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "ml-1 flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/title:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export function TitleIconButton({
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
        "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[#555] transition-colors duration-150 hover:bg-[#2a2a2a] hover:text-[#aaa]",
        className,
      )}
      {...props}
    />
  );
}

export function TaskViewFooter({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-[1] flex items-center justify-between gap-3 border-t border-border-app bg-background-primary px-6 pb-3.5 pt-2.5",
        className,
      )}
      {...props}
    />
  );
}

export function FooterActions({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  );
}

export function SnoozeButton({
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
        "flex cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-[#666] transition-colors duration-150 hover:text-[#888]",
        className,
      )}
      {...props}
    />
  );
}

export function DeleteTaskFooterButton({
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
        "flex cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2 py-1.5 text-sm text-[#666] transition-colors duration-150 hover:text-red-500",
        className,
      )}
      {...props}
    />
  );
}

type CreateTaskButtonProps = UiProps<"button"> & {
  inactive: boolean;
};

export function CreateTaskButton({
  className,
  type = "button",
  inactive,
  disabled,
  ref,
  ...props
}: CreateTaskButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "rounded-md border px-4 py-2 text-sm font-medium transition-colors duration-150",
        isDisabled
          ? "cursor-not-allowed border-white/[0.08] bg-[#242426] text-[#8c8c8c]"
          : "cursor-pointer border-transparent bg-[#7255c1] text-white hover:bg-[#5a42a1]",
        className,
      )}
      {...props}
    />
  );
}

type TaskSaveButtonProps = UiProps<"button"> & {
  inactive: boolean;
};

export function TaskSaveButton({
  className,
  type = "button",
  inactive,
  disabled,
  ref,
  ...props
}: TaskSaveButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors duration-150",
        isDisabled
          ? "cursor-not-allowed border-white/[0.08] bg-[#242426] text-[#8c8c8c]"
          : "cursor-pointer border-transparent bg-[#7255c1] text-white hover:bg-[#5a42a1]",
        className,
      )}
      {...props}
    />
  );
}
