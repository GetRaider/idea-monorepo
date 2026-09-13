import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import {
  buildAnalyticsMetrics,
  buildTimeByActivity,
  buildTimeByDay,
  formatDurationLabel,
  getAnalyticsDataset,
  resolveAnalyticsPeriod,
  type AnalyticsPeriodPreset,
  type TimeByDayBucket,
} from "../../../helpers/analytics.helper";
import { buildActivityFilterOptions } from "../../../helpers/history.helper";
import type { FocusRecord, SavedSession } from "../../../shared/records.types";

import { PeriodFilter } from "./PeriodFilter";
import { cn } from "../lib/cn";

export function AnalyticsSection({ records, sessions }: AnalyticsSectionProps) {
  const [periodPreset, setPeriodPreset] =
    useState<AnalyticsPeriodPreset>("week");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const filterOptions = useMemo(
    () => buildActivityFilterOptions(sessions),
    [sessions],
  );
  const period = useMemo(
    () =>
      resolveAnalyticsPeriod(
        periodPreset,
        new Date(),
        periodPreset === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : null,
      ),
    [periodPreset, customStartDate, customEndDate],
  );
  const dataset = useMemo(
    () => getAnalyticsDataset(records, period, selectedActivityId || null),
    [records, period, selectedActivityId],
  );
  const metrics = useMemo(
    () => buildAnalyticsMetrics(dataset, period?.calendarDayCount ?? 0),
    [dataset, period],
  );
  const timeByDay = useMemo(
    () => (period === null ? [] : buildTimeByDay(dataset, period)),
    [dataset, period],
  );
  const timeByActivity = useMemo(
    () => buildTimeByActivity(dataset, sessions),
    [dataset, sessions],
  );
  const maxDaySeconds = timeByDay.reduce(
    (maxSeconds, bucket) => Math.max(maxSeconds, bucket.totalSeconds),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-8 py-6">
      <h1 className="m-0 text-xl font-medium">Analytics</h1>
      <PeriodFilter
        periodPreset={periodPreset}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        activityId={selectedActivityId}
        activityOptions={filterOptions}
        onPeriodChange={setPeriodPreset}
        onCustomStartChange={setCustomStartDate}
        onCustomEndChange={setCustomEndDate}
        onActivityChange={setSelectedActivityId}
      />
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Focus Time"
          value={formatDurationLabel(metrics.focusSeconds)}
          emphasize
        />
        <StatCard
          label="Break Time"
          value={formatDurationLabel(metrics.breakSeconds)}
        />
        <StatCard label="Sessions" value={String(metrics.sessionCount)} />
        <StatCard
          label="Daily Average"
          value={`${formatDurationLabel(metrics.dailyAverageSeconds)} / day`}
        />
        <StatCard
          label="Avg. Session"
          value={formatDurationLabel(metrics.averageSessionSeconds)}
        />
        <StatCard
          label="Longest Session"
          value={formatDurationLabel(metrics.longestSessionSeconds)}
        />
        <StatCard
          label="Active Days"
          value={`${metrics.activeDayCount} / ${metrics.calendarDayCount}`}
        />
      </div>
      <ChartBlock title="Time by Day">
        {period === null ? (
          <p className="m-0 text-xs text-tempo-muted">Pick a custom date range.</p>
        ) : (
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {timeByDay.map((bucket) => (
              <TimeBarRow
                key={bucket.key}
                label={bucket.label}
                valueLabel={formatDurationLabel(bucket.totalSeconds)}
                widthPercent={barWidthPercent(bucket, maxDaySeconds)}
              />
            ))}
          </div>
        )}
      </ChartBlock>
      <ChartBlock title="Time by Activity">
        {timeByActivity.length === 0 ? (
          <p className="m-0 text-xs text-tempo-muted">
            No activity in this period.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {timeByActivity.map((item) => (
              <TimeBarRow
                key={item.colorKey}
                label={item.label}
                valueLabel={`${formatDurationLabel(item.totalSeconds)}   ${item.percent}%`}
                widthPercent={item.percent}
                hue={item.hue}
                saturation={item.saturation}
              />
            ))}
          </div>
        )}
      </ChartBlock>
    </div>
  );
}

function ChartBlock({ title, children }: ChartBlockProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 text-[0.7rem] font-medium uppercase tracking-[0.04em] text-tempo-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, emphasize = false }: StatCardProps) {
  return (
    <div className="rounded-xl border border-tempo-line bg-tempo-panel px-3 py-2.5">
      <p className="m-0 text-[0.7rem] uppercase tracking-[0.04em] text-tempo-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-semibold tabular-nums text-tempo-text",
          emphasize ? "text-2xl" : "text-[1.05rem]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TimeBarRow({
  label,
  valueLabel,
  widthPercent,
  hue = 258,
  saturation = 72,
}: TimeBarRowProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-tempo-text">
      <span className="w-28 shrink-0 truncate text-tempo-muted">{label}</span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full w-[var(--bar-width)] rounded-full bg-[var(--bar-color)]"
          style={
            {
              "--bar-width": `${Math.max(0, Math.min(widthPercent, 100))}%`,
              "--bar-color": `hsl(${hue} ${saturation}% 52%)`,
            } as CSSProperties
          }
        />
      </div>
      <span className="shrink-0 tabular-nums text-tempo-muted">{valueLabel}</span>
    </div>
  );
}

function barWidthPercent(bucket: TimeByDayBucket, maxSeconds: number): number {
  if (maxSeconds <= 0) {
    return 0;
  }

  return (bucket.totalSeconds / maxSeconds) * 100;
}

interface AnalyticsSectionProps {
  records: FocusRecord[];
  sessions: SavedSession[];
}

interface ChartBlockProps {
  title: string;
  children: ReactNode;
}

interface StatCardProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

interface TimeBarRowProps {
  label: string;
  valueLabel: string;
  widthPercent: number;
  hue?: number;
  saturation?: number;
}
