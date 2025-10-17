"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/Button/Button.component";

import { signOut, useSession } from "@lib/auth-client";
import {
  Main,
  Content,
  UserInfo,
  UserAvatar,
  UserDetails,
  MainTitle,
  Description,
} from "./page.styles";
import { UsersSection } from "./components/Users-Section/users-section.component";
import { AuthGuard } from "@components/AuthGuard/AuthGuard.component";
import { GitHubProfile } from "./components/GitHubProfile/GitHubProfile.component";
import { ContributionStats } from "./components/ContributionStats/ContributionStats.component";

export default function HomePage() {
  const [showUsers, setShowUsers] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [showGithubStats, setShowGithubStats] = useState(false);
  const { data: session } = useSession();

  const handleShowGithubStats = () => {
    if (githubUsername.trim()) {
      setShowGithubStats(true);
    }
  };

  return (
    <AuthGuard>
      <Main>
        <Content>
          <MainTitle>Welcome to Devinity</MainTitle>
          <Description>
            Your personal development companion. Manage your projects and ideas.
          </Description>

          <UserInfo>
            <UserAvatar
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
            />
            <UserDetails>
              <span>
                Welcome back, {session?.user?.name || session?.user?.email}!
              </span>
              <Button onClick={() => signOut()}>Sign out</Button>
            </UserDetails>
          </UserInfo>

          <div style={{ marginTop: "24px", marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "12px" }}>GitHub Statistics</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Enter GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShowGithubStats()}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  flex: 1,
                  maxWidth: "300px",
                }}
              />
              <Button onClick={handleShowGithubStats}>Show GitHub Stats</Button>
              {showGithubStats && (
                <Button onClick={() => setShowGithubStats(false)}>
                  Hide Stats
                </Button>
              )}
            </div>
          </div>

          {showGithubStats && githubUsername && (
            <>
              <GitHubProfile username={githubUsername} />
              <ContributionStats username={githubUsername} />
            </>
          )}

          <div style={{ marginTop: "24px" }}>
            <Button onClick={() => setShowUsers(!showUsers)}>
              {showUsers ? "Hide" : "Show"} Users
            </Button>
            {showUsers && <UsersSection />}
          </div>
        </Content>
      </Main>
    </AuthGuard>
  );
}
