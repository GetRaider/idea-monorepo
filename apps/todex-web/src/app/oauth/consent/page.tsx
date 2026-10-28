"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@repo/ui";

import { env } from "@lib/env";

const SCOPE_LABELS: Record<string, string> = {
  "todex:read": "Read your Todex workspace",
  "todex:write": "Create and update Todex documents and tasks",
  openid: "Identify you",
  profile: "Read your name",
  email: "Read your email",
  offline_access: "Stay connected",
};

export default function OAuthConsentPage() {
  return (
    <Suspense>
      <OAuthConsent />
    </Suspense>
  );
}

function OAuthConsent() {
  const searchParams = useSearchParams();
  const consentCode = searchParams.get("consent_code");
  const clientId = searchParams.get("client_id");
  const scopes = (searchParams.get("scope") ?? "")
    .split(" ")
    .filter((scope) => scope.length > 0);
  const [clientName, setClientName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    void fetch(`${env.api.baseUrl}/api/auth/oauth2/client/${clientId}`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { name?: string };
      })
      .then((body) => {
        if (!cancelled && body?.name) setClientName(body.name);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function decide(accept: boolean) {
    if (!consentCode) return;
    setPending(true);
    setError(null);
    const response = await fetch(`${env.api.baseUrl}/api/auth/oauth2/consent`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept, consent_code: consentCode }),
    });
    const body = (await response.json().catch(() => null)) as {
      redirectURI?: string;
      message?: string;
    } | null;
    if (!response.ok || !body?.redirectURI) {
      setPending(false);
      setError(body?.message ?? "Could not finish authorization");
      return;
    }
    window.location.assign(body.redirectURI);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-panel p-8">
        <h1 className="text-xl font-semibold">Connect to Todex</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {clientName ?? "An application"} wants access to your workspace.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {scopes.map((scope) => (
            <li key={scope}>{SCOPE_LABELS[scope] ?? scope}</li>
          ))}
        </ul>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            disabled={pending || !consentCode}
            onClick={() => void decide(true)}
          >
            Allow
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || !consentCode}
            onClick={() => void decide(false)}
          >
            Deny
          </Button>
        </div>
      </div>
    </main>
  );
}
