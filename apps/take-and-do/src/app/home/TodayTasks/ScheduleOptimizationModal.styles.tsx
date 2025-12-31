"use client";

import styled, { keyframes, css } from "styled-components";

// Animated gradient keyframes
const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const animatedGradientBackground = css`
  background: linear-gradient(
    135deg,
    #1a0a2e 0%,
    #2d1b4e 25%,
    #6a00ff 50%,
    #8b5cf6 75%,
    #9333ea 100%
  );
  background-size: 200% 200%;
  animation: ${gradientShift} 15s ease infinite;
  will-change: background-position;
  transform: translateZ(0);
`;

const animatedGradientHover = css`
  animation-duration: 10s;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 32px;
  max-width: 800px;
  width: 100%;
  min-height: 400px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: #fff;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 16px;
`;

export const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #fff;
`;

export const ModalDescription = styled.h3`
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  color: #cbd5e1;
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const OptimizationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const SummarySection = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
`;

export const SummaryText = styled.p`
  margin: 0;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.6;
`;

export const WorkloadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

export const WorkloadCard = styled.div`
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;

export const WorkloadLabel = styled.div`
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
`;

export const WorkloadValue = styled.div`
  color: #fff;
  font-size: 24px;
  font-weight: 600;
`;

export const RecommendationsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

export const RecommendationCard = styled.div`
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 16px;
`;

export const TaskName = styled.div`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const ScheduleChange = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 8px;

  strong {
    color: #10b981;
  }
`;

export const ArrowIcon = styled.span`
  color: #667eea;
`;

export const ReasonText = styled.div`
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.5;
`;

export const RisksList = styled.ul`
  margin: 0;
  padding-left: 20px;
`;

export const RiskItem = styled.li`
  color: #f59e0b;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
`;

export const InsightsList = styled.ul`
  margin: 0;
  padding-left: 20px;
`;

export const InsightItem = styled.li`
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
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

export const LoadingState = styled.div`
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
`;

export const ErrorState = styled.div`
  padding: 20px;
  text-align: center;
  color: #ef4444;
  font-size: 14px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
`;

export const TaskSelectionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
`;

export const TaskCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #7255c1;
`;

export const TaskLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  span {
    color: #e2e8f0;
    font-size: 14px;
  }

  &:hover {
    border-color: #4a4a4a;
    background: #2f2f2f;
  }
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #2a2a2a;
`;

export const CancelButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    border-color: #4a4a4a;
  }
`;

export const OptimizeButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${animatedGradientBackground}

  &:hover:not(:disabled) {
    ${animatedGradientHover}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    animation: none;
    background: #7255c1;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    background: #7255c1 !important;

    &:hover:not(:disabled) {
      background: #8255d1 !important;
    }
  }
`;

export const GenerateOptimizationButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${animatedGradientBackground}

  &:hover:not(:disabled) {
    ${animatedGradientHover}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    animation: none;
    background: #7255c1;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    background: #7255c1 !important;

    &:hover:not(:disabled) {
      background: #8255d1 !important;
    }
  }
`;


