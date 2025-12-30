"use client";

import styled from "styled-components";

export const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
  overflow: hidden;
`;

export const MainContent = styled.main<{ $withNavSidebar: boolean }>`
  flex: 1;
  margin-left: ${(props) => (props.$withNavSidebar ? "340px" : "60px")};
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
  padding: 32px;
  color: #fff;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
`;

export const WelcomeSection = styled.div`
  margin-bottom: 32px;
`;

export const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Subtitle = styled.p`
  font-size: 18px;
  color: #cbd5e1;
  margin: 0;
`;

export const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
