"use client";

import { CloseIcon } from "@/components/Icons";
import { CloseButton } from "@/components/Buttons";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  AISection,
  AICard,
  CardHeader,
  CardTitle,
  AIBadge,
  CardContent,
  CardList,
} from "./ProductivitySummaryModal.styles";
import type { AnalyticsData } from "@/services/api/analytics.api.service";

interface ProductivitySummaryModalProps {
  analytics: AnalyticsData;
  onClose: () => void;
}

export function ProductivitySummaryModal({
  analytics,
  onClose,
}: ProductivitySummaryModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const insights = Array.isArray(analytics.insights) ? analytics.insights : [];
  const recommendations = Array.isArray(analytics.recommendations)
    ? analytics.recommendations
    : [];

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>⚡ Productivity Summary</ModalTitle>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </ModalHeader>

        <AISection>
          <AICard>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              {analytics.aiGenerated && <AIBadge>AI</AIBadge>}
            </CardHeader>
            <CardContent>{analytics.summary}</CardContent>
          </AICard>

          <AICard>
            <CardTitle style={{ marginBottom: "12px" }}>Insights</CardTitle>
            <CardList>
              {insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </CardList>
          </AICard>

          <AICard>
            <CardTitle $color="#f59e0b" style={{ marginBottom: "12px" }}>
              Risks
            </CardTitle>
            <CardList>
              {analytics.risks.length > 0 ? (
                analytics.risks.map((risk, idx) => <li key={idx}>{risk}</li>)
              ) : (
                <li>No significant risks detected.</li>
              )}
            </CardList>
          </AICard>

          <AICard>
            <CardTitle $color="#10b981" style={{ marginBottom: "12px" }}>
              Recommendations
            </CardTitle>
            <CardList>
              {recommendations.length > 0
                ? recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)
                : null}
            </CardList>
          </AICard>
        </AISection>
      </ModalContent>
    </ModalOverlay>
  );
}
