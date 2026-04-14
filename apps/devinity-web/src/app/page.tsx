"use client";

import { useState } from "react";
import { Button, cn } from "@repo/ui";

import { signOut, useSession } from "@lib/auth-client";
import { UsersSection } from "./components/Users-Section/users-section.component";
import { AuthGuard } from "@components/AuthGuard/AuthGuard.component";

export default function HomePage() {
  const [showUsers, setShowUsers] = useState(false);
  const { data: session } = useSession();

  return (
    <AuthGuard>
      <main
        className={cn(
          "flex min-h-[calc(100vh-4rem)] flex-col items-center justify-start bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8 sm:px-8 lg:px-24",
          "max-md:min-h-[calc(100vh-3.5rem)]",
        )}
      >
        <div className="flex w-full max-w-[800px] flex-col items-center gap-8 text-center max-md:gap-6">
          <h1 className="m-0 bg-gradient-to-br from-violet-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent max-md:text-2xl max-sm:text-[1.75rem]">
            Welcome to Devinity
          </h1>
          <p className="m-0 max-w-[600px] text-xl leading-relaxed text-slate-300 max-md:text-base max-sm:text-sm">
            Your personal development companion. Manage your projects and ideas.
          </p>

          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <img
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
              className="h-12 w-12 rounded-full border-2 border-white/20"
            />
            <div className="flex flex-col items-start gap-2">
              <span className="font-medium text-slate-50">
                Welcome back, {session?.user?.name || session?.user?.email}!
              </span>
              <Button onClick={() => signOut()}>Sign out</Button>
            </div>
          </div>

          <Button onClick={() => setShowUsers(!showUsers)}>
            {showUsers ? "Hide" : "Show"} Users
          </Button>
          {showUsers && <UsersSection />}
        </div>
      </main>
    </AuthGuard>
  );
}
