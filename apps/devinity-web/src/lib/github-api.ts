import {
  GitHubUser,
  GitHubRepository,
  ContributionStats,
} from "@repo/api/models/github.model";
import { env } from "./env";

interface GitHubUserResponse {
  user: GitHubUser;
}

interface GitHubStatsResponse {
  contributions: ContributionStats;
}

interface GitHubRepositoriesResponse {
  repositories: GitHubRepository[];
  totalCount: number;
}

class GitHubApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${env.api.baseUrl}/github`;
  }

  private async fetchApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return response.json();
  }

  async getUserProfile(username: string): Promise<GitHubUser> {
    const data = await this.fetchApi<GitHubUserResponse>(`/user/${username}`);
    return data.user;
  }

  async getUserStats(username: string): Promise<ContributionStats> {
    const data = await this.fetchApi<GitHubStatsResponse>(
      `/user/${username}/stats`,
    );
    return data.contributions;
  }

  async getUserRepositories(
    username: string,
    page: number = 1,
    perPage: number = 30,
  ): Promise<{ repositories: GitHubRepository[]; totalCount: number }> {
    const data = await this.fetchApi<GitHubRepositoriesResponse>(
      `/user/${username}/repositories?page=${page}&perPage=${perPage}`,
    );
    return data;
  }
}

export const githubApi = new GitHubApiClient();

