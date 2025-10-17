"use client";

import { useGitHubStats } from "@hooks/github/useGitHubStats";
import {
  StatsContainer,
  StatsTitle,
  StatsGrid,
  StatCard,
  StatCardTitle,
  StatCardValue,
  StatCardSubtitle,
  DetailSection,
  DetailTitle,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  ErrorMessage,
  LoadingMessage,
} from "./ContributionStats.styles";

interface ContributionStatsProps {
  username: string;
}

export function ContributionStats({ username }: ContributionStatsProps) {
  const { stats, loading, error } = useGitHubStats(username);

  if (loading) {
    return <LoadingMessage>Loading contribution statistics...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!stats) {
    return null;
  }

  return (
    <StatsContainer>
      <StatsTitle>Contribution Statistics (Last Year)</StatsTitle>

      <StatsGrid>
        <StatCard>
          <StatCardTitle>Total Commits</StatCardTitle>
          <StatCardValue>{stats.commits.lastYear}</StatCardValue>
          <StatCardSubtitle>commits in the last year</StatCardSubtitle>
        </StatCard>

        <StatCard>
          <StatCardTitle>Issues</StatCardTitle>
          <StatCardValue>{stats.issues.opened}</StatCardValue>
          <StatCardSubtitle>opened</StatCardSubtitle>
        </StatCard>

        <StatCard>
          <StatCardTitle>Pull Requests</StatCardTitle>
          <StatCardValue>{stats.pullRequests.opened}</StatCardValue>
          <StatCardSubtitle>opened</StatCardSubtitle>
        </StatCard>

        <StatCard>
          <StatCardTitle>Code Reviews</StatCardTitle>
          <StatCardValue>{stats.codeReviews.total}</StatCardValue>
          <StatCardSubtitle>reviews contributed</StatCardSubtitle>
        </StatCard>
      </StatsGrid>

      <DetailSection>
        <DetailTitle>Issues Detail</DetailTitle>
        <DetailGrid>
          <DetailItem>
            <DetailLabel>Opened</DetailLabel>
            <DetailValue>{stats.issues.opened}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Closed</DetailLabel>
            <DetailValue>{stats.issues.closed}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Commented</DetailLabel>
            <DetailValue>{stats.issues.commented}</DetailValue>
          </DetailItem>
        </DetailGrid>
      </DetailSection>

      <DetailSection>
        <DetailTitle>Pull Requests Detail</DetailTitle>
        <DetailGrid>
          <DetailItem>
            <DetailLabel>Opened</DetailLabel>
            <DetailValue>{stats.pullRequests.opened}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Merged</DetailLabel>
            <DetailValue>{stats.pullRequests.merged}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Reviewed</DetailLabel>
            <DetailValue>{stats.pullRequests.reviewed}</DetailValue>
          </DetailItem>
        </DetailGrid>
      </DetailSection>
    </StatsContainer>
  );
}

