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
import {
  Section,
  SectionHeader,
  SectionTitle,
  Controls,
  TimeframeSelect,
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
  LoadingContainer,
  Spinner,
} from "./ProductivityOverview.styles";
import { ProductivitySummaryModal } from "./ProductivitySummaryModal";
import { ProductivitySummarySelectionModal } from "./ProductivitySummarySelectionModal";
import type { AnalyticsStats } from "@/lib/ai";
import { EmptyState } from "@/components/EmptyState";
import { Dropdown } from "@/components/Dropdown";
import { AnalyticsData, Timeframe } from "@/services/api/analytics.api.service";
import { apiServices } from "@/services/api";

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
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"basic" | "ai" | null>(
    null,
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // TODO: Use apiServices.analytics.getStatsByTimeframe(timeframe);
        const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          if (data?.stats) setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  const handleOpenSelectionModal = () => {
    setIsSelectionModalOpen(true);
    setSelectedOption(null);
  };

  const handleSelectOption = (useAI: boolean) => {
    setSelectedOption(useAI ? "ai" : "basic");
  };

  const handleSave = async () => {
    if (selectedOption === null) return;

    try {
      setIsGeneratingAnalytics(true);

      const statsResponse = await fetch(
        `/api/analytics?timeframe=${timeframe}`,
      );
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const { stats: fetchedStats } = await statsResponse.json();

      const analyticsResponse = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: fetchedStats,
          timeframe,
          shouldUseAI: selectedOption === "ai",
        }),
      });

      if (!analyticsResponse.ok) {
        throw new Error("Failed to generate analytics");
      }

      const data = await analyticsResponse.json();
      setAnalytics(data.analytics);
      setIsSelectionModalOpen(false);
      setIsResultsModalOpen(true);
      setSelectedOption(null);
    } catch (error) {
      console.error("Failed to generate analytics:", error);
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
              onClick={handleOpenSelectionModal}
              $disabled={isGeneratingAnalytics}
            >
              ⚡ Explore AI Summary
            </GenerateButton>
          </Controls>
        </SectionHeader>
        {isLoading ? (
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : stats ? (
          <Charts stats={stats} />
        ) : (
          <EmptyState
            title="You have no analytics"
            message="You have no tasks to build analytics"
          />
        )}
      </Section>

      {isSelectionModalOpen && (
        <ProductivitySummarySelectionModal
          onClose={() => {
            setIsSelectionModalOpen(false);
            setSelectedOption(null);
          }}
          onSelect={handleSelectOption}
          selectedOption={selectedOption}
          onSave={handleSave}
          isGenerating={isGeneratingAnalytics}
        />
      )}

      {isResultsModalOpen && analytics && (
        <ProductivitySummaryModal
          analytics={analytics}
          onClose={() => setIsResultsModalOpen(false)}
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
            <Bar dataKey="value" fill="#667eea" radius={[6, 6, 0, 0]} />
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
                $progress={Math.min(
                  (stats.avgCompletionTimeDays / 7) * 100,
                  100,
                )}
              />
            </ProgressBarContainer>
          </div>
          <div>
            <MetricRow>
              <MetricLabel>Overdue Rate</MetricLabel>
              <MetricValue $warning={isOverdueWarning}>
                {(stats.overdueRate * 100).toFixed(1)}%
              </MetricValue>
            </MetricRow>
            <ProgressBarContainer>
              <ProgressBar
                $progress={stats.overdueRate * 100}
                $warning={isOverdueWarning}
              />
            </ProgressBarContainer>
          </div>
        </MetricsContainer>
      </ChartCard>
    </ChartsGrid>
  );
}
