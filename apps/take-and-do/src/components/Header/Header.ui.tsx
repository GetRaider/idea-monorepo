"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type HeaderContainerProps = ComponentProps<"header">;

export function HeaderContainer({
  className,
  ref,
  ...props
}: HeaderContainerProps) {
  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center border-b border-border-app bg-nav-sidebar-bg px-8",
        className,
      )}
      {...props}
    />
  );
}

type ContentProps = ComponentProps<"div">;

export function Content({ className, ref, ...props }: ContentProps) {
  return (
    <div
      ref={ref}
      className={cn("flex w-full items-center justify-between", className)}
      {...props}
    />
  );
}

type TitleProps = ComponentProps<"h1">;

export function Title({ className, ref, ...props }: TitleProps) {
  return (
    <h1
      ref={ref}
      className={cn("m-0 text-lg font-semibold text-white", className)}
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

type IconButtonProps = ComponentProps<"button">;

export function IconButton({
  className,
  type = "button",
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#888] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type NotificationBadgeProps = ComponentProps<"span">;

export function NotificationBadge({
  className,
  ref,
  ...props
}: NotificationBadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-nav-sidebar-bg bg-red-500 text-[10px] font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}
