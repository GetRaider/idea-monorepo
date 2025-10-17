"use client";

import { useGitHubProfile } from "@hooks/github/useGitHubProfile";
import {
  ProfileCard,
  ProfileHeader,
  Avatar,
  ProfileInfo,
  Name,
  Username,
  Bio,
  Stats,
  StatItem,
  StatValue,
  StatLabel,
  ErrorMessage,
  LoadingMessage,
} from "./GitHubProfile.styles";

interface GitHubProfileProps {
  username: string;
}

export function GitHubProfile({ username }: GitHubProfileProps) {
  const { profile, loading, error } = useGitHubProfile(username);

  if (loading) {
    return <LoadingMessage>Loading GitHub profile...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!profile) {
    return null;
  }

  return (
    <ProfileCard>
      <ProfileHeader>
        <Avatar src={profile.avatar_url} alt={profile.name || profile.login} />
        <ProfileInfo>
          <Name>{profile.name || profile.login}</Name>
          <Username
            href={profile.html_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{profile.login}
          </Username>
          {profile.bio && <Bio>{profile.bio}</Bio>}
        </ProfileInfo>
      </ProfileHeader>
      <Stats>
        <StatItem>
          <StatValue>{profile.public_repos}</StatValue>
          <StatLabel>Repositories</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{profile.followers}</StatValue>
          <StatLabel>Followers</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{profile.following}</StatValue>
          <StatLabel>Following</StatLabel>
        </StatItem>
      </Stats>
    </ProfileCard>
  );
}

