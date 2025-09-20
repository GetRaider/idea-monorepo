"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/Button/Button.component";

import { UsersSection } from "../components/Users-Section/users-section.component";
import { signIn, signOut, useSession } from "../../lib/auth-client";
import { Main, Content, AuthContainer } from "../page.styles";

export default function HomePage() {
  const [showUsers, setShowUsers] = useState(false);
  const { data: session } = useSession();
  return (
    <Main>
      <Content>
        <AuthContainer>
          {session?.user ? (
            <>
              <span>
                Signed in as {session.user.email || session.user.name}
              </span>
              <Button onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Button onClick={() => signIn.social({ provider: "github" })}>
                Sign in with GitHub
              </Button>
            </>
          )}
        </AuthContainer>
        <Button onClick={() => setShowUsers(!showUsers)}>Show Users</Button>
        {showUsers && <UsersSection />}
      </Content>
    </Main>
  );
}
