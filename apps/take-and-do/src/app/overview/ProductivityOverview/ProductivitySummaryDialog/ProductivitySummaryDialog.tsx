"use client";

import { CloseIcon } from "@/components/Icons";
import { CloseButton } from "@/components/Buttons";
import { DialogHeading, DialogScrim } from "@/components/Dialogs";
import {
  DialogContent,
  DialogHeader,
  AISection,
  AICard,
  CardHeader,
  CardTitle,
  AIBadge,
  CardContent,
  CardList,
} from "./ProductivitySummaryDialog.ui";
import type { AnalyticsData } from "@/services";

interface ProductivitySummaryDialogProps {
  analytics: AnalyticsData;
  onClose: () => void;
}

export function ProductivitySummaryDialog({
  analytics,
  onClose,
}: ProductivitySummaryDialogProps) {
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
    <DialogScrim onClick={handleOverlayClick}>
      <DialogContent>
        <DialogHeader>
          <DialogHeading>Productivity Summary</DialogHeading>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </DialogHeader>

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
            <CardTitle accentColor="#f59e0b" style={{ marginBottom: "12px" }}>
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
            <CardTitle accentColor="#10b981" style={{ marginBottom: "12px" }}>
              Recommendations
            </CardTitle>
            <CardList>
              {recommendations.length > 0
                ? recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)
                : null}
            </CardList>
          </AICard>
        </AISection>
      </DialogContent>
    </DialogScrim>
  );
}
