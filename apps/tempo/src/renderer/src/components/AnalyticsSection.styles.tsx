import styled from "styled-components";

export const AnalyticsShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const FilterSelect = styled.select`
  border: 1px solid rgba(155, 92, 255, 0.22);
  border-radius: 10px;
  background: #16101f;
  color: #f4eefe;
  padding: 0.4rem 0.55rem;
  max-width: 180px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`;

export const StatCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(155, 92, 255, 0.22);
  background: #16101f;
  padding: 0.65rem 0.75rem;
`;

export const StatLabel = styled.p`
  margin: 0;
  color: #9b8fb0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const StatValue = styled.p`
  margin: 0.25rem 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

export const HeatmapFrame = styled.div`
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.85rem;
`;

export const HeatmapLayout = styled.div`
  display: flex;
  gap: 4px;
  width: max-content;
`;

export const HeatmapLabels = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #9b8fb0;
  font-size: 9px;
  line-height: 12px;
`;

export const HeatmapLabelSlot = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
`;

export const HeatmapWeeks = styled.div`
  display: flex;
  gap: 4px;
`;

export const HeatmapColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const HeatmapCell = styled.span<{
  $level: number;
  $hue: number;
  $saturation: number;
}>`
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: ${({ $level, $hue, $saturation }) =>
    heatmapCellBackground($level, $hue, $saturation)};
`;

export const LegendList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.85rem;
`;

export const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #f4eefe;
  font-size: 0.75rem;
`;

export const LegendSwatch = styled.span<{ $hue: number; $saturation: number }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $hue, $saturation }) => `hsl(${$hue} ${$saturation}% 48%)`};
`;

function heatmapCellBackground(
  level: number,
  hue: number,
  saturation: number,
): string {
  if (level <= 0) {
    return "rgba(255, 255, 255, 0.12)";
  }
  if (level === 1) {
    return `hsl(${hue} ${saturation}% 28%)`;
  }
  if (level === 2) {
    return `hsl(${hue} ${saturation}% 38%)`;
  }
  if (level === 3) {
    return `hsl(${hue} ${saturation}% 48%)`;
  }
  return `hsl(${hue} ${saturation}% 58%)`;
}
