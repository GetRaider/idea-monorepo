import { useState, useEffect } from "react";
import { ContributionStats } from "@repo/api/models/github.model";
import { githubApi } from "@lib/github-api";

interface UseGitHubStatsResult {
  stats: ContributionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGitHubStats(username: string | null): UseGitHubStatsResult {
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!username) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await githubApi.getUserStats(username);
      setStats(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch GitHub stats";
      setError(errorMessage);
      console.error("Error fetching GitHub stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [username]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

