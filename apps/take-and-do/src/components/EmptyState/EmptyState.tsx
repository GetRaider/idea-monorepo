"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function EmptyState({
  title = "You have no tasks",
  message,
}: EmptyStateProps = {}) {
  return (
    <EmptyStateContainer>
      <EmptyStateImageWrapper>
        <Image src="/empty-state.svg" alt="No tasks" width={96} height={96} />
      </EmptyStateImageWrapper>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {message && <EmptyStateText>{message}</EmptyStateText>}
    </EmptyStateContainer>
  );
}

function EmptyStateContainer({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center px-5 py-10 text-center",
        className,
      )}
      {...props}
    />
  );
}

function EmptyStateImageWrapper({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("relative mb-4 h-24 w-24", className)}
      {...props}
    />
  );
}

function EmptyStateTitle({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 mb-2 text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}

function EmptyStateText({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn("m-0 text-sm text-[#888]", className)}
      {...props}
    />
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
}
