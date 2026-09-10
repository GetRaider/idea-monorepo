import { cn } from "../lib/cn";

export function ClockDisplay({ value, overGoal = false }: ClockDisplayProps) {
  return (
    <div
      className={cn(
        "z-[1] font-display text-[clamp(78px,17vw,168px)] font-[250] leading-[0.9] tracking-[-0.05em] tabular-nums [font-feature-settings:'tnum'_1] text-tempo-text transition-colors",
        overGoal ? "text-tempo-accent" : null,
      )}
    >
      {value}
    </div>
  );
}

interface ClockDisplayProps {
  value: string;
  overGoal?: boolean;
}
