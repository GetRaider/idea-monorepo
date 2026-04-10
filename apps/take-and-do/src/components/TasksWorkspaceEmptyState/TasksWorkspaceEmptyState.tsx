"use client";

import { PlusIcon } from "@/components/Icons";
import { RocketIcon } from "@/components/Icons/RocketIcon";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function TasksWorkspaceEmptyState({
  onCreateWorkspace,
  className,
}: TasksWorkspaceEmptyStateProps) {
  return (
    <Outer className={className}>
      <GridBackdrop aria-hidden />
      <Inner>
        <IconCard>
          <RocketIcon size={28} className="text-[var(--text-primary)]" />
        </IconCard>
        <Title>No workspace exists yet</Title>
        <Subtitle>
          You can create a new workspace and manage your tasks.
        </Subtitle>
        <CreateWorkspacePrimaryButton onClick={onCreateWorkspace}>
          <PlusIcon size={16} className="shrink-0 text-white" />
          Create Workspace
        </CreateWorkspacePrimaryButton>
      </Inner>
    </Outer>
  );
}

function Outer({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-6 py-12",
        className,
      )}
      {...props}
    />
  );
}

function GridBackdrop({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="aspect-[4/5] h-[min(520px,72vh)] w-[min(92vw,480px)] opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_72%_65%_at_50%_48%,#000_22%,transparent_78%)]"
      />
    </div>
  );
}

function Inner({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-[1] flex max-w-md flex-col items-center gap-5 text-center",
        className,
      )}
      {...props}
    />
  );
}

function IconCard({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-dropdown)]",
        className,
      )}
      {...props}
    />
  );
}

function Title({ className, ref, ...props }: UiProps<"h2">) {
  return (
    <h2
      ref={ref}
      className={cn(
        "m-0 text-lg font-semibold leading-snug text-[var(--text-primary)]",
        className,
      )}
      {...props}
    />
  );
}

function Subtitle({ className, ref, ...props }: UiProps<"p">) {
  return (
    <p
      ref={ref}
      className={cn(
        "m-0 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}

export function CreateWorkspacePrimaryButton({
  className,
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-0 bg-[#7255c1] px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

interface TasksWorkspaceEmptyStateProps {
  onCreateWorkspace: () => void;
  className?: string;
}
