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
  TimeframeSelect,
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
} from "./StatisticsOverview.styles";
import type { Timeframe } from "../SummarySection/SummarySection.types";
import type { AnalyticsStats } from "./StatisticsOverview.types";

interface StatisticsOverviewProps {}

const CHART_TOOLTIP_STYLE = {
  background: "#2a2a2a",
  border: "1px solid #3a3a3a",
  borderRadius: "6px",
  color: "#fff",
};

function StatisticsOverview({}: StatisticsOverviewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          if (data?.stats) {
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  if (isLoading || !stats) {
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>📊 Statistics Overview</SectionTitle>
          <TimeframeSelect
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </TimeframeSelect>
        </SectionHeader>
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </Section>
    );
  }

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
    <Section>
      <SectionHeader>
        <SectionTitle>📊 Statistics Overview</SectionTitle>
        <TimeframeSelect
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as Timeframe)}
        >
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
        </TimeframeSelect>
      </SectionHeader>
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
    </Section>
  );
}

export default StatisticsOverview;
