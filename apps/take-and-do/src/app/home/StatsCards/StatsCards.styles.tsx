"use client";

import styled from "styled-components";

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

export const StatCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }
`;

export const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border-radius: 8px;
  color: #667eea;
`;

export const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #888;
  font-weight: 500;
`;

