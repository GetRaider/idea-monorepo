"use client";

import styled from "styled-components";

export const Section = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #fff;
`;

export const TimeframeSelect = styled.select`
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
`;

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
`;

export const ChartCard = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #333;
`;

export const ChartTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #888;
`;

export const MetricsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const MetricLabel = styled.span`
  color: #cbd5e1;
  font-size: 13px;
`;

export const MetricValue = styled.span<{ $warning?: boolean }>`
  color: ${(props) => (props.$warning ? "#f59e0b" : "#fff")};
  font-size: 14px;
  font-weight: 600;
`;

export const ProgressBarContainer = styled.div`
  height: 6px;
  background: #2a2a2a;
  border-radius: 3px;
  overflow: hidden;
`;

export const ProgressBar = styled.div<{
  $progress: number;
  $warning?: boolean;
}>`
  height: 100%;
  width: ${(props) => props.$progress}%;
  background: ${(props) => (props.$warning ? "#f59e0b" : "#667eea")};
  transition: width 0.3s;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #2a2a2a;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
