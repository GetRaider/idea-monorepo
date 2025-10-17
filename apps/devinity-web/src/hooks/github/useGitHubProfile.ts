import { useState, useEffect } from "react";
import { GitHubUser } from "@repo/api/models/github.model";
import { githubApi } from "@lib/github-api";

interface UseGitHubProfileResult {
  profile: GitHubUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGitHubProfile(
  username: string | null,
): UseGitHubProfileResult {
  const [profile, setProfile] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!username) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await githubApi.getUserProfile(username);
      setProfile(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch GitHub profile";
      setError(errorMessage);
      console.error("Error fetching GitHub profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

