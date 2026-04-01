"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Spinner } from "@/components/Spinner/Spinner";
import {
  Section,
  SectionHeader,
  SectionTitle,
  Controls,
  GenerateButton,
  ChartsGrid,
  ChartCard,
  ChartTitle,
  MetricsContainer,
  MetricRow,
  MetricLabel,
  MetricValue,
  ProgressBarContainer,
  ProgressBar,
} from "./ProductivityOverview.ui";
import { ProductivitySummaryDialog } from "./ProductivitySummaryDialog/ProductivitySummaryDialog";
import { ProductivitySummarySelectionDialog } from "./ProductivitySummarySelectionDialog/ProductivitySummarySelectionDialog";
import type { AnalyticsStats } from "@/services/ai";
import { EmptyState } from "@/components/EmptyState";
import { Dropdown } from "@/components/Dropdown";
import { clientServices } from "@/services/client";
import { toast } from "sonner";
import type { AnalyticsData, Timeframe } from "@/services/client";

const CHART_TOOLTIP_STYLE = {
  background: "#2a2a2a",
  border: "1px solid #3a3a3a",
  borderRadius: "6px",
  color: "#fff",
};

export function ProductivityOverview() {
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

  return (
    <>
      <Section>
        <SectionHeader>
          <SectionTitle>📊 Productivity Overview</SectionTitle>
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
            />
            <GenerateButton
              onClick={handleOpenSelectionDialog}
              inactive={isGeneratingAnalytics}
            >
              ⚡ Explore AI Summary
            </GenerateButton>
          </Controls>
        </SectionHeader>
        {isLoading ? (
          <Spinner />
        ) : stats ? (
          <Charts stats={stats} />
        ) : (
          <EmptyState
            title="You have no analytics"
            message="You have no tasks to build analytics"
          />
        )}
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

function Charts({ stats }: { stats: AnalyticsStats }) {
  const barChartData = [
    { name: "Created", value: stats.tasksCreated },
    { name: "Completed", value: stats.tasksCompleted },
  ];

  const pieChartData = [
    { name: "Completed", value: stats.tasksCompleted },
    { name: "Pending", value: stats.tasksCreated - stats.tasksCompleted },
  ];

  const isOverdueWarning = stats.overdueRate > 0.2;
  return (
    <ChartsGrid>
      <ChartCard>
        <ChartTitle>Task Completion</ChartTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
              dataKey="value"
              fill="var(--brand-primary)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard>
        <ChartTitle>Completion Rate</ChartTitle>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard>
        <ChartTitle>Performance Metrics</ChartTitle>
        <MetricsContainer>
          <div>
            <MetricRow>
              <MetricLabel>Avg Completion Time</MetricLabel>
              <MetricValue>
                {stats.avgCompletionTimeDays.toFixed(1)} days
              </MetricValue>
            </MetricRow>
            <ProgressBarContainer>
              <ProgressBar
                progress={Math.min(
                  (stats.avgCompletionTimeDays / 7) * 100,
                  100,
                )}
              />
            </ProgressBarContainer>
          </div>
          <div>
            <MetricRow>
              <MetricLabel>Overdue Rate</MetricLabel>
              <MetricValue isWarning={isOverdueWarning}>
                {(stats.overdueRate * 100).toFixed(1)}%
              </MetricValue>
            </MetricRow>
            <ProgressBarContainer>
              <ProgressBar
                progress={stats.overdueRate * 100}
                isWarning={isOverdueWarning}
              />
            </ProgressBarContainer>
          </div>
        </MetricsContainer>
      </ChartCard>
    </ChartsGrid>
  );
}
