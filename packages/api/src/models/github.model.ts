export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
}

export interface CommitActivity {
  total: number;
  week: string;
  days: number[];
}

export interface IssueContribution {
  opened: number;
  closed: number;
  commented: number;
}

export interface PullRequestContribution {
  opened: number;
  merged: number;
  reviewed: number;
}

export interface ContributionStats {
  commits: {
    total: number;
    lastYear: number;
    byMonth: { month: string; count: number }[];
  };
  issues: IssueContribution;
  pullRequests: PullRequestContribution;
  codeReviews: {
    total: number;
    lastYear: number;
  };
  contributionsLastYear: number;
}

export interface GitHubUserStats {
  user: GitHubUser;
  contributions: ContributionStats;
  topRepositories: GitHubRepository[];
}

