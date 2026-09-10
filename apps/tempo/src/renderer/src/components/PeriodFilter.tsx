import { cn } from "../lib/cn";

import type { AnalyticsPeriodPreset } from "../../../helpers/analytics.helper";

const PERIOD_PRESETS: Array<{ id: AnalyticsPeriodPreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom" },
];

export function PeriodFilter({
  periodPreset,
  customStartDate,
  customEndDate,
  activityId,
  activityOptions,
  onPeriodChange,
  onCustomStartChange,
  onCustomEndChange,
  onActivityChange,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
          {PERIOD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={periodPreset === preset.id}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs",
                periodPreset === preset.id
                  ? "border-tempo-accent bg-tempo-accent-wash text-tempo-text"
                  : "border-tempo-line bg-tempo-panel text-tempo-muted",
              )}
              onClick={() => onPeriodChange(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <select
          className="max-w-[180px] rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-tempo-text"
          value={activityId}
          onChange={(event) => onActivityChange(event.target.value)}
          aria-label="Activity"
        >
          {activityOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {periodPreset === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[0.7rem] uppercase tracking-wide text-tempo-muted">
              From
            </span>
            <input
              type="date"
              className="rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-tempo-text"
              value={customStartDate}
              onChange={(event) => onCustomStartChange(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.7rem] uppercase tracking-wide text-tempo-muted">
              To
            </span>
            <input
              type="date"
              className="rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-tempo-text"
              value={customEndDate}
              onChange={(event) => onCustomEndChange(event.target.value)}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

interface PeriodFilterProps {
  periodPreset: AnalyticsPeriodPreset;
  customStartDate: string;
  customEndDate: string;
  activityId: string;
  activityOptions: Array<{ value: string; label: string }>;
  onPeriodChange: (preset: AnalyticsPeriodPreset) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  onActivityChange: (value: string) => void;
}
