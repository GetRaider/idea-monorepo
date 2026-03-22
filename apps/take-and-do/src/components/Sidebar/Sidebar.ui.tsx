"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function SidebarContainer({
  className,
  ref,
  ...props
}: UiProps<"aside">) {
  return (
    <aside
      ref={ref}
      className={cn(
        "fixed left-0 top-0 z-[100] flex h-screen w-[60px] flex-col items-center border-r border-border-app bg-nav-sidebar-bg py-4",
        className,
      )}
      {...props}
    />
  );
}

type LogoProps = ComponentProps<typeof Image>;

export function Logo({
  className,
  width = 40,
  height = 40,
  alt = "",
  ...props
}: LogoProps) {
  return (
    <Image
      alt={alt}
      width={width}
      height={height}
      className={cn("mb-6 h-10 w-10", className)}
      {...props}
    />
  );
}

export function Nav({ className, ref, ...props }: UiProps<"nav">) {
  return (
    <nav
      ref={ref}
      className={cn("flex flex-1 flex-col gap-2", className)}
      {...props}
    />
  );
}

type NavButtonProps = UiProps<"button"> & {
  isActive?: boolean;
};

export function NavButton({
  className,
  type = "button",
  isActive,
  disabled,
  ref,
  ...props
}: NavButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-lg border-0 bg-transparent transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-30"
          : "cursor-pointer opacity-100",
        isActive ? "bg-[#2a2a2a] text-indigo-500" : "text-[#888]",
        isActive &&
          "before:absolute before:left-[-8px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-indigo-500 before:content-['']",
        !disabled && "hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function BottomActions({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("mt-auto flex flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

export function UserAvatar({ className, ref, ...props }: UiProps<"div">) {
  return <div ref={ref} className={cn("mt-2", className)} {...props} />;
}

type AvatarProps = ComponentProps<typeof Image>;

export function Avatar({
  className,
  width = 36,
  height = 36,
  alt = "",
  ...props
}: AvatarProps) {
  return (
    <Image
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "h-9 w-9 cursor-pointer rounded-full border-2 border-border-app transition-transform duration-200 hover:scale-105 hover:border-indigo-500",
        className,
      )}
      {...props}
    />
  );
}
