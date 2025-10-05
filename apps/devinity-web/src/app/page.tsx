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

export default function HomePage() {
  const [showUsers, setShowUsers] = useState(false);
  const { data: session } = useSession();

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

          <Button onClick={() => setShowUsers(!showUsers)}>
            {showUsers ? "Hide" : "Show"} Users
          </Button>
          {showUsers && <UsersSection />}
        </Content>
      </Main>
    </AuthGuard>
  );
}
