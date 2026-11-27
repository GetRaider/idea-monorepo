import { cn } from "@repo/ui";
import type { CounterDay } from "@repo/api/todex";

/** The mark of one day: check, part ring, cross, dash, or a plain disc. */
export function DayCircle({ day }: { day: CounterDay }) {
  const mark = markFor(day);
  if (mark === "partial") {
    return <ProgressRing share={day.completed / day.capacity} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center rounded-full",
        MARK_STYLE[mark],
      )}
    >
      {mark === "filled" ? <CheckMark /> : null}
      {mark === "failed" ? <CrossMark /> : null}
      {mark === "skipped" ? <span className="text-xs">–</span> : null}
    </span>
  );
}

export function ProgressRing({ share }: { share: number }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        strokeWidth="3"
        className="stroke-white/10"
      />
      {share > 0 ? (
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          strokeWidth="3"
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

export function CheckMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3"
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
      className="size-3"
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
  return day.canComplete ? "open" : "inert";
}

const MARK_STYLE: Record<Exclude<Mark, "partial">, string> = {
  filled: "bg-foreground text-background",
  failed: "bg-white/[0.06] text-red-400",
  skipped: "border border-dashed border-amber-400 text-amber-400",
  open: "bg-white/[0.14]",
  inert: "bg-white/[0.05]",
};

type Mark = "filled" | "partial" | "failed" | "skipped" | "open" | "inert";
