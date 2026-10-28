"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@repo/ui";

import { signIn } from "@lib/auth-client";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-8">
        <h1 className="mb-2 text-xl font-semibold">Todex</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in with Google to continue.
        </p>
        <Button
          className="w-full"
          onClick={() =>
            signIn.social({
              provider: "google",
              callbackURL: next
                ? `${window.location.origin}${next}`
                : `${window.location.origin}/overview`,
            })
          }
        >
          Continue with Google
        </Button>
      </div>
    </main>
  );
}
