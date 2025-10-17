import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { env } from "../../env/env";
import {
  GitHubUser,
  GitHubRepository,
  ContributionStats,
} from "@repo/api/models/github.model";

interface GitHubSearchResponse {
  total_count: number;
  items: any[];
}

@Injectable()
export class GitHubService {
  private readonly githubToken: string;
  private readonly githubApiBase = "https://api.github.com";
  private readonly logger = new Logger(GitHubService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    this.githubToken = env.github.token;
  }

  private async fetchGitHub<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${this.githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Devinity-App",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
      throw new HttpException(
        `GitHub API error: ${response.statusText}`,
        response.status,
      );
    }

    return response.json();
  }

  async getUserProfile(username: string): Promise<GitHubUser> {
    const cacheKey = `github:user:${username}`;
    const cached = await this.cacheManager.get<GitHubUser>(cacheKey);

    if (cached) {
      this.logger.log(`✅ Returning GitHub user ${username} from cache`);
      return cached;
    }

    this.logger.log(`📦 Fetching GitHub user ${username} from API`);
    const user = await this.fetchGitHub<GitHubUser>(
      `${this.githubApiBase}/users/${username}`,
    );

    await this.cacheManager.set(cacheKey, user, 1800000); // 30 minutes
    return user;
  }

  async getUserRepositories(
    username: string,
    page: number = 1,
    perPage: number = 30,
  ): Promise<{ repositories: GitHubRepository[]; totalCount: number }> {
    const cacheKey = `github:repos:${username}:${page}:${perPage}`;
    const cached = await this.cacheManager.get<{
      repositories: GitHubRepository[];
      totalCount: number;
    }>(cacheKey);

    if (cached) {
      this.logger.log(`✅ Returning GitHub repos for ${username} from cache`);
      return cached;
    }

    this.logger.log(`📦 Fetching GitHub repos for ${username} from API`);
    const repositories = await this.fetchGitHub<GitHubRepository[]>(
      `${this.githubApiBase}/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`,
    );

    const result = {
      repositories,
      totalCount: repositories.length,
    };

    await this.cacheManager.set(cacheKey, result, 1800000); // 30 minutes
    return result;
  }

  async getUserContributionStats(username: string): Promise<ContributionStats> {
    const cacheKey = `github:stats:${username}`;
    const cached = await this.cacheManager.get<ContributionStats>(cacheKey);

    if (cached) {
      this.logger.log(`✅ Returning GitHub stats for ${username} from cache`);
      return cached;
    }

    this.logger.log(`📦 Fetching GitHub stats for ${username} from API`);

    try {
      // Get current date and date from a year ago
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const currentYear = now.getFullYear();
      const lastYear = oneYearAgo.getFullYear();

      // Fetch commits from search API
      const commitsLastYear = await this.searchCommits(
        username,
        oneYearAgo,
        now,
      );

      // Fetch issues
      const issuesOpened = await this.searchIssues(
        username,
        "created",
        oneYearAgo,
        now,
      );
      const issuesClosed = await this.searchIssues(
        username,
        "closed",
        oneYearAgo,
        now,
      );
      const issuesCommented = await this.searchIssues(
        username,
        "commented",
        oneYearAgo,
        now,
      );

      // Fetch pull requests
      const prsOpened = await this.searchPullRequests(
        username,
        "created",
        oneYearAgo,
        now,
      );
      const prsMerged = await this.searchPullRequests(
        username,
        "merged",
        oneYearAgo,
        now,
      );
      const prsReviewed = await this.searchPullRequests(
        username,
        "reviewed-by",
        oneYearAgo,
        now,
      );

      // Calculate monthly commit distribution
      const byMonth = this.generateMonthlyDistribution(currentYear, lastYear);

      const stats: ContributionStats = {
        commits: {
          total: commitsLastYear,
          lastYear: commitsLastYear,
          byMonth,
        },
        issues: {
          opened: issuesOpened,
          closed: issuesClosed,
          commented: issuesCommented,
        },
        pullRequests: {
          opened: prsOpened,
          merged: prsMerged,
          reviewed: prsReviewed,
        },
        codeReviews: {
          total: prsReviewed,
          lastYear: prsReviewed,
        },
        contributionsLastYear:
          commitsLastYear + issuesOpened + prsOpened + prsReviewed,
      };

      await this.cacheManager.set(cacheKey, stats, 1800000); // 30 minutes
      return stats;
    } catch (error) {
      this.logger.error(`Error fetching stats for ${username}:`, error);
      throw new HttpException(
        "Failed to fetch contribution statistics",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async searchCommits(
    username: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const query = `author:${username} committer-date:${this.formatDate(from)}..${this.formatDate(to)}`;
    const result = await this.fetchGitHub<GitHubSearchResponse>(
      `${this.githubApiBase}/search/commits?q=${encodeURIComponent(query)}&per_page=1`,
    );
    return result.total_count;
  }

  private async searchIssues(
    username: string,
    type: "created" | "closed" | "commented",
    from: Date,
    to: Date,
  ): Promise<number> {
    let query = "";
    if (type === "created") {
      query = `author:${username} type:issue created:${this.formatDate(from)}..${this.formatDate(to)}`;
    } else if (type === "closed") {
      query = `author:${username} type:issue closed:${this.formatDate(from)}..${this.formatDate(to)}`;
    } else {
      query = `commenter:${username} type:issue updated:${this.formatDate(from)}..${this.formatDate(to)}`;
    }

    const result = await this.fetchGitHub<GitHubSearchResponse>(
      `${this.githubApiBase}/search/issues?q=${encodeURIComponent(query)}&per_page=1`,
    );
    return result.total_count;
  }

  private async searchPullRequests(
    username: string,
    type: "created" | "merged" | "reviewed-by",
    from: Date,
    to: Date,
  ): Promise<number> {
    let query = "";
    if (type === "created") {
      query = `author:${username} type:pr created:${this.formatDate(from)}..${this.formatDate(to)}`;
    } else if (type === "merged") {
      query = `author:${username} type:pr is:merged merged:${this.formatDate(from)}..${this.formatDate(to)}`;
    } else {
      query = `reviewed-by:${username} type:pr updated:${this.formatDate(from)}..${this.formatDate(to)}`;
    }

    const result = await this.fetchGitHub<GitHubSearchResponse>(
      `${this.githubApiBase}/search/issues?q=${encodeURIComponent(query)}&per_page=1`,
    );
    return result.total_count;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  private generateMonthlyDistribution(
    currentYear: number,
    lastYear: number,
  ): { month: string; count: number }[] {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const currentMonth = now.getMonth();

    const result: { month: string; count: number }[] = [];

    // Generate for last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? lastYear : currentYear;
      result.push({
        month: `${months[monthIndex]} ${year}`,
        count: 0, // We'll populate this with actual data in a more sophisticated implementation
      });
    }

    return result;
  }
}

