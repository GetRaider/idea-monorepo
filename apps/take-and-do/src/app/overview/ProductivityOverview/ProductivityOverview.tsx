"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, type CustomTooltipProps } from "@tremor/react";
import { AIActionButton, PrimaryButton } from "@/components/Buttons";
import { Spinner } from "@/components/Spinner/Spinner";
import {
  Section,
  SectionHeader,
  SectionTitle,
  Controls,
  ChartsGrid,
  ChartCard,
  ChartTitle,
} from "./ProductivityOverview.ui";
import { ProductivitySummaryDialog } from "./ProductivitySummaryDialog/ProductivitySummaryDialog";
import { ProductivitySummarySelectionDialog } from "./ProductivitySummarySelectionDialog/ProductivitySummarySelectionDialog";
import type { AnalyticsStats } from "@/server/services/ai";
import { Dropdown } from "@/components/Dropdown";
import { clientServices } from "@/services";
import { toast } from "sonner";
import type { AnalyticsData, Timeframe } from "@/services";
import { cn } from "@/lib/styles/utils";
import { Route } from "@/constants/route.constant";
import { ProductivityOverviewIcon } from "@/components/Icons/ProductivityOverviewIcon";
import { AIIcon } from "@/components/Icons/AIIcon";
import { OverviewEmptyStateBackdrop } from "@/app/overview/OverviewEmptyStateBackdrop";
import { LightningIcon } from "@/components/Icons/LightningIcon";

export function ProductivityOverview({
  hasWorkspaceTaskData,
}: ProductivityOverviewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isGeneratingAnalytics, setIsGeneratingAnalytics] = useState(false);
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"basic" | "ai" | null>(
    null,
  );

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const fetchedStats =
          await clientServices.analytics.getStatsByTimeframe(timeframe);
        setStats(fetchedStats);
        if (fetchedStats === null) {
          toast.error("Can't load productivity stats");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  const handleOpenSelectionDialog = () => {
    setIsSelectionDialogOpen(true);
    setSelectedOption(null);
  };

  const handleSelectOption = (useAI: boolean) => {
    setSelectedOption(useAI ? "ai" : "basic");
  };

  const handleSave = async () => {
    if (selectedOption === null) return;

    setIsGeneratingAnalytics(true);
    try {
      const fetchedStats =
        await clientServices.analytics.getStatsByTimeframe(timeframe);
      if (!fetchedStats) {
        toast.error("Can't load stats for summary");
        return;
      }

      const generatedAnalytics = await clientServices.analytics.generateSummary(
        {
          stats: fetchedStats,
          timeframe,
          shouldUseAI: selectedOption === "ai",
        },
      );
      if (!generatedAnalytics) {
        toast.error("Can't generate productivity summary");
        return;
      }

      setAnalytics(generatedAnalytics);
      setIsSelectionDialogOpen(false);
      setIsResultsDialogOpen(true);
      setSelectedOption(null);
    } finally {
      setIsGeneratingAnalytics(false);
    }
  };

  const controlsDisabled = !hasWorkspaceTaskData;

  return (
    <>
      <Section>
        <SectionHeader className="mb-0 pb-4">
          <SectionTitle>
            <ProductivityOverviewIcon
              size={20}
              className="shrink-0 text-white"
              aria-hidden
            />
            <span>Productivity Overview</span>
          </SectionTitle>
          <Controls>
            <Dropdown
              options={[
                { label: "All", value: "all" },
                { label: "Week", value: "week" },
                { label: "Month", value: "month" },
                { label: "Quarter", value: "quarter" },
              ]}
              value={timeframe}
              onChange={(value: Timeframe) => setTimeframe(value)}
              disabled={controlsDisabled}
            />
            <AIActionButton
              onClick={handleOpenSelectionDialog}
              inactive={controlsDisabled || isGeneratingAnalytics}
            >
              <AIIcon size={16} /> Explore AI Summary
            </AIActionButton>
          </Controls>
        </SectionHeader>
        <div className="-mx-6 border-t border-border-app px-6 pt-6">
          {isLoading ? (
            <Spinner />
          ) : stats && hasDashboardData(stats) ? (
            <Charts stats={stats} />
          ) : stats === null ? (
            <ProductivityMetricsEmptyState variant="error" />
          ) : (
            <ProductivityMetricsEmptyState variant="encourage" />
          )}
        </div>
      </Section>

      {isSelectionDialogOpen && (
        <ProductivitySummarySelectionDialog
          onClose={() => {
            setIsSelectionDialogOpen(false);
            setSelectedOption(null);
          }}
          onSelect={handleSelectOption}
          selectedOption={selectedOption}
          onSave={handleSave}
          isGenerating={isGeneratingAnalytics}
        />
      )}

      {isResultsDialogOpen && analytics && (
        <ProductivitySummaryDialog
          analytics={analytics}
          onClose={() => setIsResultsDialogOpen(false)}
        />
      )}
    </>
  );
}

function hasDashboardData(stats: AnalyticsStats): boolean {
  const priorityTotal = Object.values(stats.tasksByPriority).reduce(
    (sum, bucket) => sum + bucket.total,
    0,
  );
  return (
    priorityTotal > 0 || stats.tasksCreated > 0 || stats.tasksCompleted > 0
  );
}

const tremorChartSurfaceClassName =
  "text-[var(--text-primary)] [&_.recharts-cartesian-axis-tick_text]:fill-[var(--text-secondary)] [&_.recharts-cartesian-axis-tick_line]:stroke-[var(--border-color)] [&_.recharts-cartesian-grid_line]:stroke-[var(--border-color)] [&_.recharts-legend-item-text]:fill-[var(--text-secondary)] [&_.recharts-legend-wrapper_.recharts-text]:fill-[var(--text-secondary)] [&_.recharts-label]:fill-[var(--text-secondary)] [&_text.recharts-text]:fill-[var(--text-secondary)] [&_.recharts-tooltip-cursor]:stroke-[var(--border-color)] [&_.recharts-active-dot]:fill-violet-500 [&_.recharts-dot]:stroke-[var(--border-color)]";

function Charts({ stats }: ChartsProps) {
  const completionRatePercent =
    stats.tasksCreated > 0
      ? (stats.tasksCompleted / stats.tasksCreated) * 100
      : 0;
  const openTasksInPeriod = Math.max(
    0,
    stats.tasksCreated - stats.tasksCompleted,
  );
  const headroomToPerfectPercent = Math.max(0, 100 - completionRatePercent);

  const avgCompletionAreaData = stats.avgCompletionTimeDaysByWeek.map(
    (week) => ({
      name: week.weekLabel,
      "Average days": week.avgDays,
    }),
  );

  const priorityOrder = [
    { key: "critical" as const, label: "Critical" },
    { key: "high" as const, label: "High" },
    { key: "medium" as const, label: "Medium" },
    { key: "low" as const, label: "Low" },
  ];
  const maxPriorityTotal = Math.max(
    ...priorityOrder.map(({ key }) => stats.tasksByPriority[key].total),
    1,
  );
  const criticalUnresolved = stats.tasksByPriority.critical.unresolved;

  return (
    <ChartsGrid>
      <ChartCard>
        <ChartTitle>Completion Rate</ChartTitle>
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-4xl font-semibold tabular-nums text-white">
            {completionRatePercent.toFixed(0)}%
          </span>
          <WeekOverWeekCompletionComparison
            deltaPercentagePoints={stats.completionRateWeekOverWeekDeltaPp}
          />
          {stats.tasksCreated > 0 ? (
            <p className="m-0 mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
              {openTasksInPeriod === 0 ? (
                <>
                  All tasks created in this period are done —{" "}
                  <span className="text-[var(--text-primary)]">100%</span> is
                  the ceiling for this cohort.
                </>
              ) : (
                <>
                  <span className="text-[var(--text-primary)]">
                    {openTasksInPeriod}
                  </span>{" "}
                  still open in this period. Finishing them would bring this
                  view to{" "}
                  <span className="text-[var(--text-primary)]">100%</span>
                  {headroomToPerfectPercent > 0 ? (
                    <>
                      {" "}
                      (you have{" "}
                      <span className="text-[var(--text-primary)]">
                        {headroomToPerfectPercent.toFixed(0)}%
                      </span>{" "}
                      headroom vs. that ceiling).
                    </>
                  ) : null}
                </>
              )}
            </p>
          ) : null}
        </div>
      </ChartCard>

      <ChartCard>
        <ChartTitle>Average Completion Time</ChartTitle>
        <AreaChart
          className={cn("mt-2 h-52", tremorChartSurfaceClassName)}
          data={avgCompletionAreaData}
          index="name"
          categories={["Average days"]}
          colors={["violet"]}
          valueFormatter={(value) => String(Math.round(Number(value)))}
          allowDecimals={false}
          showAnimation={false}
          yAxisWidth={40}
          minValue={0}
          customTooltip={ProductivityAreaTooltip}
        />
      </ChartCard>

      <ChartCard>
        <ChartTitle className="flex flex-wrap items-center gap-2">
          <span>Tasks by priority</span>
          {criticalUnresolved > 0 ? (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500">
              {criticalUnresolved} critical open
            </span>
          ) : null}
        </ChartTitle>
        <div className="mt-3 flex flex-col gap-3">
          {priorityOrder.map(({ key, label }) => {
            const bucket = stats.tasksByPriority[key];
            const widthPercent = (bucket.total / maxPriorityTotal) * 100;
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between text-[13px] text-slate-300">
                  <span>{label}</span>
                  <span className="tabular-nums text-white">
                    {bucket.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--input-bg)]">
                  <div
                    className="h-full rounded-sm bg-indigo-500 transition-[width] duration-300"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </ChartsGrid>
  );
}

function ProductivityAreaTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const value = row?.value;
  const name = row?.name ?? row?.dataKey ?? "Average days";
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  const displayValue = Number.isFinite(numericValue)
    ? String(Math.round(numericValue))
    : String(value ?? "—");
  return (
    <div
      className={cn(
        "min-w-[9rem] rounded-lg border border-[var(--border-color)] bg-[var(--background-primary)] px-3 py-2.5 shadow-[var(--shadow-dropdown)]",
      )}
    >
      <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">
        {label}
      </p>
      <p className="m-0 text-sm text-[var(--text-secondary)]">
        <span className="text-[var(--text-primary)]">{name}</span>
        {": "}
        <span className="font-medium tabular-nums text-[var(--text-primary)]">
          {displayValue}
        </span>
      </p>
    </div>
  );
}

function WeekOverWeekCompletionComparison({
  deltaPercentagePoints,
}: WeekOverWeekCompletionComparisonProps) {
  const rounded = Math.round(deltaPercentagePoints * 10) / 10;
  if (rounded === 0) {
    return (
      <p className="m-0 text-sm text-[var(--text-secondary)]">
        Same completion rate as last week.
      </p>
    );
  }
  const isPositive = rounded > 0;
  const magnitude = Math.abs(rounded);
  return (
    <div className="flex flex-col gap-0.5">
      <p
        className={cn(
          "m-0 text-sm font-medium",
          isPositive ? "text-emerald-400" : "text-red-400",
        )}
      >
        {isPositive ? "↑" : "↓"} {magnitude.toFixed(1)} percentage points{" "}
        {isPositive ? "higher" : "lower"} than last week
      </p>
      <p className="m-0 text-xs leading-snug text-[var(--text-tertiary)]">
        “Percentage points” is the change in completion share (e.g. 40% → 43% is
        +3 points), not a percent of your headline rate.
      </p>
    </div>
  );
}

function ProductivityMetricsEmptyState({
  variant,
}: ProductivityMetricsEmptyStateProps) {
  const router = useRouter();

  const handleCreateFirstTask = () => router.push(Route.TASKS);

  return (
    <div className="relative flex min-h-[280px] flex-col items-center justify-center px-6 py-12">
      <OverviewEmptyStateBackdrop />
      <div className="relative z-[1] flex max-w-md flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--background-primary)] shadow-[var(--shadow-dropdown)]">
          <LightningIcon size={28} className="text-[var(--text-primary)]" />
        </div>
        {variant === "encourage" ? (
          <>
            <h2 className="m-0 text-lg font-semibold leading-snug text-[var(--text-primary)]">
              Your productivity journey starts here
            </h2>
            <p className="m-0 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              Complete your first tasks to unlock charts, trends, and AI-powered
              insights about how you work.
            </p>
            <PrimaryButton
              type="button"
              onClick={handleCreateFirstTask}
              size="sm"
            >
              Create Task →
            </PrimaryButton>
          </>
        ) : (
          <>
            <h2 className="m-0 text-lg font-semibold leading-snug text-[var(--text-primary)]">
              Couldn&apos;t load productivity insights
            </h2>
            <p className="m-0 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              Check your connection and try refreshing the page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface ChartsProps {
  stats: AnalyticsStats;
}

interface WeekOverWeekCompletionComparisonProps {
  deltaPercentagePoints: number;
}

interface ProductivityMetricsEmptyStateProps {
  variant: "encourage" | "error";
}

interface ProductivityOverviewProps {
  hasWorkspaceTaskData: boolean;
}
