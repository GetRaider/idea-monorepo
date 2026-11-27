import { cn } from "@repo/ui";
import type { CounterDay } from "@repo/api/todex";

/**
 * The mark of one day: check, part ring, cross, dash, an open or upcoming
 * circle, or a dot when the day is off the schedule.
 */
export function DayCircle({ day }: { day: CounterDay }) {
  const mark = markFor(day);
  if (mark === "partial") {
    return (
      <span className="relative flex">
        <ProgressRing
          share={day.completed / day.capacity}
          className="size-7 sm:size-9"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums"
        >
          {day.completed}
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-7 items-center justify-center sm:size-9"
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          mark === "off" ? "size-1.5" : "size-full",
          MARK_STYLE[mark],
        )}
      >
        {mark === "filled" ? <CheckMark className="size-4" /> : null}
        {mark === "failed" ? <CrossMark /> : null}
        {mark === "skipped" ? <span className="text-sm">–</span> : null}
      </span>
    </span>
  );
}

export function ProgressRing({
  share,
  className = "size-5",
}: {
  share: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("-rotate-90", className)}
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="8.5"
        fill="none"
        strokeWidth="2.5"
        className="stroke-white/10"
      />
      {share > 0 ? (
        <circle
          cx="10"
          cy="10"
          r="8.5"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          // A path length of 100 lets the dash be written as a percentage.
          pathLength="100"
          strokeDasharray={`${share * 100} 100`}
          className="stroke-foreground"
        />
      ) : null}
    </svg>
  );
}

export function CheckMark({ className = "size-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4.5 4.5L19 7" />
    </svg>
  );
}

function CrossMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function markFor(day: CounterDay): Mark {
  if (day.fill !== "empty") return day.fill;
  if (day.skipped > 0) return "skipped";
  if (day.failed > 0) return "failed";
  if (!day.tracked) return "off";
  return day.loggable ? "open" : "upcoming";
}

const MARK_STYLE: Record<Exclude<Mark, "partial">, string> = {
  filled: "bg-foreground text-background",
  failed: "bg-red-400/10 text-red-400",
  skipped: "border border-dashed border-amber-400 text-amber-400",
  open: "border-2 border-white/15 bg-white/[0.04] group-hover:border-white/50",
  upcoming: "border border-dashed border-white/20",
  off: "bg-white/15",
};

type Mark =
  | "filled"
  | "partial"
  | "failed"
  | "skipped"
  | "open"
  | "upcoming"
  | "off";
