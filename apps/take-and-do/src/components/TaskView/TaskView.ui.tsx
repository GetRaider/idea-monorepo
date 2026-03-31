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
        "flex max-h-[90vh] min-w-0 w-full max-w-[800px] flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-border-app bg-card-bg pb-0 shadow-dialog max-[600px]:max-h-[95vh] max-[600px]:rounded-lg",
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
        "flex flex-wrap items-center justify-between gap-2 border-b border-border-app px-6 py-[18px] max-[600px]:px-4 max-[600px]:py-3.5",
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
      className={cn("flex items-center gap-1 text-base text-[#888]", className)}
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
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1.5 text-[#888] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white [&_svg]:h-[18px] [&_svg]:w-[18px]",
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
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 leading-none text-[#888] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-red-500 [&_svg]:m-0 [&_svg]:block [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
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
        "flex min-w-0 items-center gap-3 px-6 pb-4 pt-6",
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
        "absolute left-0 top-full z-[1001] mt-1 min-w-[150px] rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
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
      rowTransition="all"
      className={className}
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

export function CommentInputWrapper({
  className,
  ref,
  ...props
}: UiProps<"div">) {
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
  return (
    <div
      ref={ref}
      className={cn("text-sm leading-relaxed text-[#888]", className)}
      {...props}
    />
  );
}

export function NoDescriptionText({
  className,
  ref,
  ...props
}: UiProps<"span">) {
  return <span ref={ref} className={cn("text-[#666]", className)} {...props} />;
}

export function TaskViewFooter({ className, ref, ...props }: UiProps<"div">) {
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
