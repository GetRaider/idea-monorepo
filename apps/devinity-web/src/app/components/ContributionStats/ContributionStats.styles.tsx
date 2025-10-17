"use client";

import styled from "styled-components";

export const StatsContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

export const StatsTitle = styled.h3`
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

export const StatCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export const StatCardTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

export const StatCardValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
`;

export const StatCardSubtitle = styled.div`
  font-size: 14px;
  opacity: 0.8;
`;

export const DetailSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
`;

export const DetailTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`;

export const DetailItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
`;

export const DetailLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
`;

export const DetailValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

export const ErrorMessage = styled.div`
  background: #ff4444;
  color: white;
  padding: 16px;
  border-radius: 8px;
`;

export const LoadingMessage = styled.div`
  background: #f0f0f0;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  color: #666;
`;


