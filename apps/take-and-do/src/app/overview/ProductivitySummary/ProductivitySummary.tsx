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
} from "./ProductivitySummary.ui";
import { ChevronDownIcon } from "@/components/Icons";
import type { AnalyticsData, Timeframe } from "@/services/client";

export function ProductivitySummary({
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
        <SectionTitle>⚡ Explore AI Productivity</SectionTitle>
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
              inactive={isGenerating}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
              <ChevronDownIcon
                size={16}
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </GenerateButton>
            {isDropdownOpen && (
              <DropdownMenu onMouseLeave={() => setIsDropdownOpen(false)}>
                <DropdownItem onClick={() => handleGenerate(false)}>
                  Basic Summary
                </DropdownItem>
                <DropdownItem hasBorder onClick={() => handleGenerate(true)}>
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
            <CardTitle>Insights</CardTitle>
            <CardList>
              {analytics.insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </CardList>
          </AICard>

          {analytics.risks.length > 0 && (
            <AICard>
              <CardTitle accentColor="#f59e0b">Risks</CardTitle>
              <CardList>
                {analytics.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </CardList>
            </AICard>
          )}

          <AICard>
            <CardTitle accentColor="#10b981">Recommendations</CardTitle>
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

interface SummarySectionProps {
  analytics: AnalyticsData | null;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onGenerateAnalytics: (useAI: boolean) => void;
  isGenerating: boolean;
}
