"use client";

import type { ComponentProps } from "react";

import { SecondaryButton } from "@/components/Buttons";
import { gradientOptionSurfaceClass } from "@/lib/animated-gradient";
import { cn } from "@/lib/utils";

type ModalOverlayProps = ComponentProps<"div">;

export function ModalOverlay({ className, ref, ...props }: ModalOverlayProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-5",
        className,
      )}
      {...props}
    />
  );
}

type ModalContentProps = ComponentProps<"div">;

export function ModalContent({ className, ref, ...props }: ModalContentProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex max-h-[90vh] min-h-[400px] w-full max-w-[800px] flex-col overflow-y-auto rounded-xl border border-border-app bg-[#1a1a1a] p-8 text-white",
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
        "relative mb-8 flex items-start justify-between",
        className,
      )}
      {...props}
    />
  );
}

type HeaderContentProps = ComponentProps<"div">;

export function HeaderContent({
  className,
  ref,
  ...props
}: HeaderContentProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col gap-2 pr-4", className)}
      {...props}
    />
  );
}

type ModalTitleProps = ComponentProps<"h2">;

export function ModalTitle({ className, ref, ...props }: ModalTitleProps) {
  return (
    <h2
      ref={ref}
      className={cn("m-0 text-2xl font-semibold text-white", className)}
      {...props}
    />
  );
}

type ModalDescriptionProps = ComponentProps<"h3">;

export function ModalDescription({
  className,
  ref,
  ...props
}: ModalDescriptionProps) {
  return (
    <h3
      ref={ref}
      className={cn(
        "m-0 text-sm font-normal leading-normal text-slate-300",
        className,
      )}
      {...props}
    />
  );
}

type OptionsContainerProps = ComponentProps<"div">;

export function OptionsContainer({
  className,
  ref,
  ...props
}: OptionsContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("mb-8 flex flex-1 flex-col gap-4", className)}
      {...props}
    />
  );
}

type OptionBlockProps = ComponentProps<"div"> & {
  $selected: boolean;
  $isAI?: boolean;
};

export function OptionBlock({
  className,
  $selected,
  $isAI,
  ref,
  ...props
}: OptionBlockProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-lg border-2 p-6 transition-all duration-200 motion-reduce:!animate-none motion-reduce:!bg-[#7255c1]",
        $isAI
          ? cn(
              gradientOptionSurfaceClass,
              "hover:animate-gradient-shift-fast",
              $selected ? "border-[#7255c1]" : "border-input-border",
            )
          : cn(
              "bg-input-bg",
              $selected
                ? "border-[#7255c1] hover:border-[#7255c1] hover:bg-input-bg"
                : "border-input-border hover:border-[#4a4a4a] hover:bg-[#2f2f2f]",
            ),
        className,
      )}
      {...props}
    />
  );
}

type OptionTitleProps = ComponentProps<"h3">;

export function OptionTitle({ className, ref, ...props }: OptionTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn("m-0 mb-2 text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}

type OptionDescriptionProps = ComponentProps<"p">;

export function OptionDescription({
  className,
  ref,
  ...props
}: OptionDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm leading-relaxed text-slate-300", className)}
      {...props}
    />
  );
}

type ActionsContainerProps = ComponentProps<"div">;

export function ActionsContainer({
  className,
  ref,
  ...props
}: ActionsContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-end gap-3 border-t border-border-app pt-6",
        className,
      )}
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
        "rounded-md border-0 bg-[#7255c1] px-5 py-2.5 text-sm font-semibold text-white hover:border-transparent hover:bg-[#8255d1] hover:disabled:bg-[#7255c1] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
