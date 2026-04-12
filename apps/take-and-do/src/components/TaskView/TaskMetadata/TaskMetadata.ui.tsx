"use client";

import {
  type ButtonHTMLAttributes,
  type ComponentProps,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";

import { Input } from "@/components/Input";

function joinClassNames(
  ...parts: Array<string | undefined | false | null>
): string {
  return parts.filter(Boolean).join(" ");
}

export function MetadataContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClassNames(
        "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3 max-[600px]:gap-2 max-[600px]:px-4",
        className,
      )}
      {...props}
    />
  );
}

export function MetadataItem({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-[#888] transition-all duration-200 hover:border-input-border hover:bg-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

type MetadataInputProps = ComponentProps<typeof Input> & { width?: string };

export function MetadataInput({
  className,
  style,
  width,
  ...props
}: MetadataInputProps) {
  return (
    <Input
      style={{ ...style, width: width ?? "80px" }}
      className={joinClassNames("px-2 py-1", className)}
      {...props}
    />
  );
}

export function MetadataIcon({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames("flex items-center text-[#888]", className)}
      {...props}
    />
  );
}

export function EstimationInput({
  className,
  type = "number",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={joinClassNames(
        "w-10 border-0 bg-transparent px-1.5 py-1 text-center text-[13px] text-white outline-none [-moz-appearance:textfield] focus:rounded focus:bg-white/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

export function EstimationLabel({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames(
        "min-w-[10px] text-[11px] text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownProps = HTMLAttributes<HTMLDivElement> & { isOpen: boolean };

export function LabelDropdown({
  className,
  isOpen,
  ...props
}: LabelDropdownProps) {
  return (
    <div
      className={joinClassNames(
        "absolute left-[var(--label-menu-left,0px)] right-auto top-full z-[1001] mt-1 box-border max-h-60 w-[200px] max-w-[min(200px,calc(100vw-48px))] overflow-y-auto rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownRowProps = HTMLAttributes<HTMLDivElement> & {
  activeMenu?: boolean;
};

export function LabelDropdownRow({
  className,
  activeMenu,
  ...props
}: LabelDropdownRowProps) {
  return (
    <div
      className={joinClassNames(
        "group flex items-center justify-between gap-2 pl-3 [&+&]:border-t [&+&]:border-input-border",
        activeMenu ? "bg-white/[0.04]" : "bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownRowToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  onTask?: boolean;
};

export function LabelDropdownRowToggle({
  className,
  type = "button",
  onTask,
  ...props
}: LabelDropdownRowToggleProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent py-2.5 pl-0 pr-2 text-left text-[13px] transition-colors duration-150 hover:text-white",
        onTask ? "text-gray-200" : "text-[#aaa]",
        className,
      )}
      {...props}
    />
  );
}

export function LabelDropdownRowLabelText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames(
        "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function LabelRowActions({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClassNames(
        "inline-flex shrink-0 items-center justify-center py-0 pl-1 pr-2 text-[#888] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-data-[menu-open=true]:opacity-100 [&_[data-label-actions-trigger]]:inline-flex [&_[data-label-actions-trigger]]:items-center [&_[data-label-actions-trigger]]:justify-center [&_[data-label-actions-trigger]]:rounded [&_[data-label-actions-trigger]]:p-1",
        className,
      )}
      {...props}
    />
  );
}

export function LabelDropdownEditInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      className={joinClassNames(
        "my-1.5 mr-2 flex-1 px-2.5 py-2 text-[13px]",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSelected?: boolean;
};

export function LabelDropdownItem({
  className,
  type = "button",
  isSelected,
  ...props
}: LabelDropdownItemProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex w-full cursor-pointer items-center gap-2 border-0 px-3 py-2.5 text-left text-[13px] text-white transition-all duration-200 first:rounded-t-lg last:rounded-b-lg hover:bg-[#3a3a3a]",
        isSelected ? "bg-[#3a3a3a]" : "bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function LabelDropdownInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      className={joinClassNames(
        "w-full border-0 border-b border-input-border bg-transparent px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type TagProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tintBg?: string;
  tintHoverBg?: string;
  tintBorder?: string;
};

export function Tag({
  className,
  type = "button",
  style,
  tintBg,
  tintHoverBg,
  tintBorder,
  onMouseEnter,
  onMouseLeave,
  ...props
}: TagProps) {
  const defaultBg = tintBg ?? "rgba(102, 126, 234, 0.1)";
  return (
    <button
      type={type}
      style={{
        ...style,
        background: defaultBg,
      }}
      className={joinClassNames(
        "flex min-w-0 max-w-[min(220px,100%)] cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-[#888] transition-all duration-200 hover:border-[rgba(102,126,234,0.3)]",
        className,
      )}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (tintHoverBg) {
          event.currentTarget.style.background = tintHoverBg;
        } else {
          event.currentTarget.style.background = "rgba(102, 126, 234, 0.2)";
        }
        if (tintBorder) {
          event.currentTarget.style.borderColor = tintBorder;
        }
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        event.currentTarget.style.background = defaultBg;
        event.currentTarget.style.borderColor = "transparent";
      }}
      {...props}
    />
  );
}

export function TagText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames(
        "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

type TagDotProps = HTMLAttributes<HTMLSpanElement> & { color?: string };

export function TagDot({ className, style, color, ...props }: TagDotProps) {
  return (
    <span
      style={{ ...style, background: color ?? "var(--brand-primary)" }}
      className={joinClassNames("h-1.5 w-1.5 shrink-0 rounded-full", className)}
      {...props}
    />
  );
}

export function AddLabelTag({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & TagProps) {
  return (
    <Tag
      tintBg="transparent"
      tintHoverBg="#2a2a2a"
      tintBorder="#4a4a4a"
      className={joinClassNames(
        "border border-dashed border-input-border text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type CreateLabelSpanProps = HTMLAttributes<HTMLSpanElement> & {
  accentColor?: string;
};

export function CreateLabelSpan({
  className,
  style,
  accentColor,
  ...props
}: CreateLabelSpanProps) {
  return (
    <span
      style={{ ...style, color: accentColor ?? "var(--brand-primary)" }}
      className={className}
      {...props}
    />
  );
}
