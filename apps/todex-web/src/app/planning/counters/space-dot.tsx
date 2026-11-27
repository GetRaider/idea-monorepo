import { cn } from "@repo/ui";

/** A space's color mark, as the sidebar shows it. */
export function SpaceDot({
  color,
  className,
}: {
  color: string | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-2.5 shrink-0 rounded-full bg-[var(--space-color)]",
        className,
      )}
      style={{ ["--space-color" as string]: color }}
    />
  );
}
