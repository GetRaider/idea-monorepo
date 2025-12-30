"use client";

import { useState, useEffect, useRef } from "react";
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
  DropdownContainer,
  GenerateButton,
  DropdownMenu,
  DropdownItem,
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
import ProductivitySummaryModal from "./ProductivitySummaryModal";
import type {
  Timeframe,
  AnalyticsData,
} from "../SummarySection/SummarySection.types";
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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isGeneratingAnalytics, setIsGeneratingAnalytics] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerateAnalytics = async (useAI: boolean) => {
    try {
      setIsGeneratingAnalytics(true);
      setIsDropdownOpen(false);

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
          shouldUseAI: useAI,
        }),
      });

      if (!analyticsResponse.ok) {
        throw new Error("Failed to generate analytics");
      }

      const data = await analyticsResponse.json();
      setAnalytics(data.analytics);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to generate analytics:", error);
    } finally {
      setIsGeneratingAnalytics(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>📊 Statistics Overview</SectionTitle>
          <Controls>
            <TimeframeSelect
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </TimeframeSelect>
            <DropdownContainer ref={dropdownRef}>
              <GenerateButton
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={() => setIsDropdownOpen(true)}
                $disabled={isGeneratingAnalytics}
                disabled={isGeneratingAnalytics}
              >
                {isGeneratingAnalytics
                  ? "⚡ Composing..."
                  : "⚡ Compose Productivity Summary"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: isDropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </GenerateButton>
              {isDropdownOpen && (
                <DropdownMenu onMouseLeave={() => setIsDropdownOpen(false)}>
                  <DropdownItem onClick={() => handleGenerateAnalytics(false)}>
                    Basic Summary
                  </DropdownItem>
                  <DropdownItem
                    $hasBorder
                    onClick={() => handleGenerateAnalytics(true)}
                  >
                    AI Summary
                  </DropdownItem>
                </DropdownMenu>
              )}
            </DropdownContainer>
          </Controls>
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
    <>
      <Section>
        <SectionHeader>
          <SectionTitle>📊 Statistics Overview</SectionTitle>
          <Controls>
            <TimeframeSelect
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </TimeframeSelect>
            <DropdownContainer ref={dropdownRef}>
              <GenerateButton
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={() => setIsDropdownOpen(true)}
                $disabled={isGeneratingAnalytics}
                disabled={isGeneratingAnalytics}
              >
                {isGeneratingAnalytics
                  ? "⚡ Composing..."
                  : "⚡ Compose Productivity Summary"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: isDropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </GenerateButton>
              {isDropdownOpen && (
                <DropdownMenu onMouseLeave={() => setIsDropdownOpen(false)}>
                  <DropdownItem onClick={() => handleGenerateAnalytics(false)}>
                    Basic Summary
                  </DropdownItem>
                  <DropdownItem
                    $hasBorder
                    onClick={() => handleGenerateAnalytics(true)}
                  >
                    AI Summary
                  </DropdownItem>
                </DropdownMenu>
              )}
            </DropdownContainer>
          </Controls>
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

      {isModalOpen && analytics && (
        <ProductivitySummaryModal
          analytics={analytics}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default StatisticsOverview;
