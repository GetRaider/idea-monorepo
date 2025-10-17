import {
  GitHubUser,
  GitHubRepository,
  ContributionStats,
} from "@repo/api/models/github.model";

export class GitHubUserResponseDto {
  user: GitHubUser;
}

export class GitHubUserStatsResponseDto {
  contributions: ContributionStats;
}

export class GitHubRepositoriesResponseDto {
  repositories: GitHubRepository[];
  totalCount: number;
}

