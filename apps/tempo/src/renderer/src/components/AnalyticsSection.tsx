import { useMemo, useState } from "react";

import {
  ANALYTICS_WEEK_COUNT,
  buildAnalyticsLegend,
  buildHeatmapGrid,
  formatDurationLabel,
  getAnalyticsPalette,
  getDailyFocusSeconds,
  getMonthlyFocusSeconds,
  getTotalFocusSeconds,
  getWeeklyFocusSeconds,
} from "../../../helpers/analytics.helper";
import {
  buildBacklogFilterOptions,
  filterRecordsByBacklogSession,
} from "../../../helpers/history.helper";

import {
  AnalyticsHeader,
  AnalyticsShell,
  FilterSelect,
  HeatmapCell,
  HeatmapColumn,
  HeatmapFrame,
  HeatmapLabelSlot,
  HeatmapLabels,
  HeatmapLayout,
  HeatmapWeeks,
  LegendItem,
  LegendList,
  LegendSwatch,
  StatCard,
  StatLabel,
  StatValue,
  StatsGrid,
} from "./AnalyticsSection.styles";

import type { FocusRecord, SavedSession } from "../../../shared/records.types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const EMPTY_CELL_PALETTE = { hue: 0, saturation: 0 };

export function AnalyticsSection({ records, sessions }: AnalyticsSectionProps) {
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const filterOptions = useMemo(
    () => buildBacklogFilterOptions(sessions),
    [sessions],
  );
  const filteredRecords = useMemo(
    () => filterRecordsByBacklogSession(records, selectedSessionId || null),
    [records, selectedSessionId],
  );
  const columns = useMemo(
    () => buildHeatmapGrid(filteredRecords, ANALYTICS_WEEK_COUNT),
    [filteredRecords],
  );
  const legendItems = useMemo(
    () => buildAnalyticsLegend(filteredRecords, sessions),
    [filteredRecords, sessions],
  );
  const sessionColorById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session.color])),
    [sessions],
  );

  return (
    <AnalyticsShell>
      <AnalyticsHeader>
        <FilterSelect
          value={selectedSessionId}
          onChange={(event) => setSelectedSessionId(event.target.value)}
        >
          {filterOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </AnalyticsHeader>
      <HeatmapFrame>
        <HeatmapLayout>
          <HeatmapLabels>
            {DAY_LABELS.map((label, index) => (
              <HeatmapLabelSlot key={`${label}-${index}`}>
                {index % 2 === 0 ? label : ""}
              </HeatmapLabelSlot>
            ))}
          </HeatmapLabels>
          <HeatmapWeeks>
            {columns.map((column) => (
              <HeatmapColumn key={column.weekStartKey}>
                {column.days.map((day) => {
                  const palette =
                    day.colorKey === null
                      ? EMPTY_CELL_PALETTE
                      : getAnalyticsPalette(day.colorKey, sessionColorById);
                  return (
                    <HeatmapCell
                      key={day.dateKey}
                      $level={day.level}
                      $hue={palette.hue}
                      $saturation={palette.saturation}
                      title={`${day.dateKey}: ${formatDurationLabel(day.totalSeconds)}`}
                    />
                  );
                })}
              </HeatmapColumn>
            ))}
          </HeatmapWeeks>
        </HeatmapLayout>
      </HeatmapFrame>
      {legendItems.length > 0 ? (
        <LegendList>
          {legendItems.map((legendItem) => (
            <LegendItem key={legendItem.colorKey}>
              <LegendSwatch
                $hue={legendItem.hue}
                $saturation={legendItem.saturation}
              />
              {legendItem.label} ({formatDurationLabel(legendItem.totalSeconds)}
              )
            </LegendItem>
          ))}
        </LegendList>
      ) : null}
      <StatsGrid>
        <StatCard>
          <StatLabel>Total</StatLabel>
          <StatValue>
            {formatDurationLabel(getTotalFocusSeconds(filteredRecords))}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>This week</StatLabel>
          <StatValue>
            {formatDurationLabel(getWeeklyFocusSeconds(filteredRecords))}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Today</StatLabel>
          <StatValue>
            {formatDurationLabel(getDailyFocusSeconds(filteredRecords))}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>This month</StatLabel>
          <StatValue>
            {formatDurationLabel(getMonthlyFocusSeconds(filteredRecords))}
          </StatValue>
        </StatCard>
      </StatsGrid>
    </AnalyticsShell>
  );
}

interface AnalyticsSectionProps {
  records: FocusRecord[];
  sessions: SavedSession[];
}
