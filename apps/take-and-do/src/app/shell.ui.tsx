"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { TASKS_SIDEBAR_DEFAULT_WIDTH_PX } from "@/helpers/tasks-sidebar-layout";
import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function PageContainer({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#3c2856]",
        className,
      )}
      {...props}
    />
  );
}

type WithNavSidebarProps = UiProps<"main"> & {
  withNavSidebar: boolean;
  /** Tasks sidebar width when open; used with nav rail (60px). */
  tasksSidebarWidthPx?: number;
};

export function TasksLayoutMain({
  className,
  withNavSidebar,
  tasksSidebarWidthPx = TASKS_SIDEBAR_DEFAULT_WIDTH_PX,
  ref,
  style,
  ...props
}: WithNavSidebarProps) {
  const marginLeftPx = withNavSidebar ? 60 + tasksSidebarWidthPx : 60;
  return (
    <main
      ref={ref}
      style={{ marginLeft: marginLeftPx, ...style }}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#3c2856]",
        className,
      )}
      {...props}
    />
  );
}

export function HomeMainContent({
  className,
  withNavSidebar,
  tasksSidebarWidthPx = TASKS_SIDEBAR_DEFAULT_WIDTH_PX,
  ref,
  style,
  ...props
}: WithNavSidebarProps) {
  const marginLeftPx = withNavSidebar ? 60 + tasksSidebarWidthPx : 60;
  return (
    <main
      ref={ref}
      style={{ marginLeft: marginLeftPx, ...style }}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-[#1a1a1a] to-[#3c2856] p-8 text-white",
        className,
      )}
      {...props}
    />
  );
}

export function LandingPageRoot({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#3c2856] p-6",
        className,
      )}
      {...props}
    />
  );
}

export function LandingContent({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("text-center text-white", className)}
      {...props}
    />
  );
}

export function LandingTitle({ className, ref, ...props }: UiProps<"h1">) {
  return (
    <h1
      ref={ref}
      className={cn(
        "mb-4 bg-gradient-to-br from-white to-purple-400 bg-clip-text text-5xl font-bold text-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function LandingSubtitle({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("mb-8 text-lg text-slate-300", className)}
      {...props}
    />
  );
}

type GetStartedLinkProps = ComponentProps<typeof Link> & { href: string };

export function GetStartedLink({
  className,
  href,
  ref,
  ...props
}: GetStartedLinkProps) {
  return (
    <Link
      ref={ref}
      href={href}
      className={cn(
        "inline-block rounded-lg border-0 bg-[#7255c1] px-7 py-3.5 text-base font-semibold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1]",
        className,
      )}
      {...props}
    />
  );
}

export function WelcomeSection({ className, ref, ...props }: UiProps<"div">) {
  return <div ref={ref} className={cn("mb-8", className)} {...props} />;
}

export function HomePageTitle({ className, ref, ...props }: UiProps<"h1">) {
  return (
    <h1
      ref={ref}
      className={cn(
        "m-0 mb-2 bg-gradient-to-br from-white to-purple-400 bg-clip-text text-4xl font-bold text-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function HomePageSubtitle({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-lg text-slate-300", className)}
      {...props}
    />
  );
}

export function HomeLoadingContainer({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex h-full items-center justify-center", className)}
      {...props}
    />
  );
}

export function TwoColumnGrid({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-6 grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6",
        className,
      )}
      {...props}
    />
  );
}
