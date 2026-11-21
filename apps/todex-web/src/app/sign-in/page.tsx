"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button, Input } from "@repo/ui";

import { signIn } from "@lib/auth-client";
import { env } from "@lib/env";

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
  const callbackPath = next?.startsWith("/") ? next : "/overview";
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
              callbackURL: `${window.location.origin}${callbackPath}`,
            })
          }
        >
          Continue with Google
        </Button>
        {env.auth.devLogin ? (
          <DevLoginForm callbackPath={callbackPath} />
        ) : null}
      </div>
    </main>
  );
}

function DevLoginForm({ callbackPath }: { callbackPath: string }) {
  const [email, setEmail] = useState("dev@todex.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed");
      return;
    }
    window.location.assign(callbackPath);
  }

  return (
    <form className="mt-6 border-t border-border pt-6" onSubmit={submit}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Local test login
      </p>
      <label className="mb-1 block text-sm" htmlFor="dev-email">
        Email
      </label>
      <Input
        id="dev-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mb-3"
      />
      <label className="mb-1 block text-sm" htmlFor="dev-password">
        Password
      </label>
      <Input
        id="dev-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mb-3"
      />
      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in as test user"}
      </Button>
    </form>
  );
}
