"use client";

import { useRef, useState, useEffect } from "react";
import {
  Section,
  SectionHeader,
  SectionTitle,
  Controls,
  TimeframeSelect,
  DropdownContainer,
  GenerateButton,
  DropdownMenu,
  DropdownItem,
  AISection,
  AICard,
  CardHeader,
  CardTitle,
  AIBadge,
  CardContent,
  CardList,
  EmptyState,
} from "./SummarySection.styles";
import { AnalyticsData, Timeframe } from "./SummarySection.types";

interface SummarySectionProps {
  analytics: AnalyticsData | null;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onGenerateAnalytics: (useAI: boolean) => void;
  isGenerating: boolean;
}

function SummarySection({
  analytics,
  timeframe,
  onTimeframeChange,
  onGenerateAnalytics,
  isGenerating,
}: SummarySectionProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = (useAI: boolean) => {
    setIsDropdownOpen(false);
    onGenerateAnalytics(useAI);
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>⚡ Productivity Summary</SectionTitle>
        <Controls>
          <TimeframeSelect
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </TimeframeSelect>
          <DropdownContainer ref={dropdownRef}>
            <GenerateButton
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onMouseEnter={() => setIsDropdownOpen(true)}
              $disabled={isGenerating}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </GenerateButton>
            {isDropdownOpen && (
              <DropdownMenu onMouseLeave={() => setIsDropdownOpen(false)}>
                <DropdownItem onClick={() => handleGenerate(false)}>
                  Basic Summary
                </DropdownItem>
                <DropdownItem $hasBorder onClick={() => handleGenerate(true)}>
                  AI Summary
                </DropdownItem>
              </DropdownMenu>
            )}
          </DropdownContainer>
        </Controls>
      </SectionHeader>

      {analytics ? (
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

          {analytics.risks.length > 0 && (
            <AICard>
              <CardTitle $color="#f59e0b" style={{ marginBottom: "12px" }}>
                Risks
              </CardTitle>
              <CardList>
                {analytics.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </CardList>
            </AICard>
          )}

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
      ) : (
        <EmptyState>
          Click &quot;Generate&quot; to create an analytics summary
        </EmptyState>
      )}
    </Section>
  );
}

export default SummarySection;
