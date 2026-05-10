"use client";

import { useEffect, useMemo, useState } from "react";

import { authClient } from "@/auth/client";

type IntegrationStatus = {
  connected: boolean;
  enabled: boolean;
  lastSyncAt: string | null;
};

export function IntegrationsSettings() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSyncLabel = useMemo(() => {
    if (!status?.lastSyncAt) return "Never";
    const dt = new Date(status.lastSyncAt);
    if (Number.isNaN(dt.getTime())) return "Unknown";
    return dt.toLocaleString();
  }, [status?.lastSyncAt]);

  async function refreshStatus() {
    setError(null);
    const res = await fetch("/api/integrations/google-calendar", {
      method: "GET",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Failed to load integration status.");
    }
    const data = (await res.json()) as IntegrationStatus;
    setStatus(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        await refreshStatus();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load integration status.",
        );
      }
    })();
  }, []);

  const connected = !!status?.connected;

  return (
    <div className="max-w-3xl rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-lg font-semibold text-white">
            Google Calendar (import only)
          </div>
          <div className="mt-1 text-sm text-slate-300">
            One-way sync: Google Calendar → Take &amp; Do. Last sync:{" "}
            <span className="text-slate-200">{lastSyncLabel}</span>
          </div>
          {error ? (
            <div className="mt-2 text-sm text-red-300">{error}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-200">
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-slate-200">
              Not connected
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!connected ? (
          <button
            type="button"
            className="rounded-lg bg-[#7255c1] px-3 py-2 text-sm font-semibold text-white hover:bg-[#5a42a1] disabled:opacity-60"
            disabled={loading || !status}
            onClick={async () => {
              if (!status) return;
              setLoading(true);
              setError(null);
              try {
                await authClient.linkSocial({
                  provider: "google",
                  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
                  callbackURL: "/settings",
                });
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Failed to start Google connection flow.",
                );
                setLoading(false);
              }
            }}
          >
            Connect Google Calendar
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg border border-red-300/40 bg-transparent px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60"
            disabled={loading}
            onClick={async () => {
              if (!status) return;
              setLoading(true);
              setError(null);
              try {
                const res = await fetch(
                  "/api/integrations/google-calendar/disconnect",
                  { method: "POST" },
                );
                if (!res.ok) {
                  const body = (await res.json().catch(() => null)) as {
                    error?: string;
                  } | null;
                  throw new Error(body?.error ?? "Disconnect failed.");
                }
                await refreshStatus();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Disconnect failed.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-400">
        When connected, events are auto-synced when you open the Calendar page.
      </div>
    </div>
  );
}
