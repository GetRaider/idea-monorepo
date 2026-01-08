"use client";

import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  AISection,
  AICard,
  CardHeader,
  CardTitle,
  AIBadge,
  CardContent,
  CardList,
} from "./ProductivitySummaryModal.styles";
import type { AnalyticsData } from "../SummarySection/SummarySection.types";

interface ProductivitySummaryModalProps {
  analytics: AnalyticsData;
  onClose: () => void;
}

function ProductivitySummaryModal({
  analytics,
  onClose,
}: ProductivitySummaryModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>⚡ Productivity Summary</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
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
              {analytics.insights.map((insight, idx) => (
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
              {analytics.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </CardList>
          </AICard>
        </AISection>
      </ModalContent>
    </ModalOverlay>
  );
}

export default ProductivitySummaryModal;

