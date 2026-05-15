"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { authClient } from "@/auth/client";
import {
  GOOGLE_CALENDAR_DISCONNECTED_EVENT,
  removeImportedGoogleCalendarEvents,
} from "@/hooks/calendar/calendar-storage";
import { clientServices } from "@/services";
import type { ApiResult } from "@/services/api-result.types";
import type { GoogleCalendarIntegrationStatus } from "@/services/google-calendar-integration.client.service";

const GCAL_OAUTH_CALLBACK_FLAG = "gcal";
const CALENDAR_EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function IntegrationsSettings() {
  const [status, setStatus] = useState<GoogleCalendarIntegrationStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledOAuthReturnRef = useRef(false);

  const lastSyncLabel = useMemo(() => {
    if (!status?.lastSyncAt) return "Never";
    const dt = new Date(status.lastSyncAt);
    if (Number.isNaN(dt.getTime())) return "Unknown";
    return dt.toLocaleString();
  }, [status?.lastSyncAt]);

  async function refreshStatus() {
    setError(null);
    const result = await clientServices.googleCalendarIntegration.getStatus();
    if (!result.ok) {
      throw new Error(
        httpErrorMessage(result) ?? "Failed to load integration status.",
      );
    }
    setStatus(result.data);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(GCAL_OAUTH_CALLBACK_FLAG) !== "1") return;
    if (handledOAuthReturnRef.current) return;
    handledOAuthReturnRef.current = true;

    params.delete(GCAL_OAUTH_CALLBACK_FLAG);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );

    void (async () => {
      try {
        const result =
          await clientServices.googleCalendarIntegration.setToggleEnabled(true);
        if (!result.ok) {
          setError(
            httpErrorMessage(result) ??
              "Google re-linked, but calendar sync could not be turned on. Try Disconnect, then connect again.",
          );
        }
        await refreshStatus();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to finish calendar setup.",
        );
      }
    })();
  }, []);

  const calendarSyncOn = !!status?.connected;

  return (
    <div className="max-w-3xl rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-lg font-semibold text-white">
            Google Calendar
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Import from Google and push edits back for linked events. Last sync:{" "}
            <span className="text-slate-200">{lastSyncLabel}</span>
          </div>
          {error ? (
            <div className="mt-2 text-sm text-red-300">{error}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {calendarSyncOn ? (
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
        {!calendarSyncOn ? (
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
                  scopes: [CALENDAR_EVENTS_SCOPE],
                  callbackURL: `/settings?${GCAL_OAUTH_CALLBACK_FLAG}=1`,
                });
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Failed to start Google connection flow.",
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            {status?.googleLinked
              ? "Reconnect Google Calendar"
              : "Connect Google Calendar"}
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
                const result =
                  await clientServices.googleCalendarIntegration.disconnect();
                if (!result.ok) {
                  throw new Error(
                    httpErrorMessage(result) ?? "Disconnect failed.",
                  );
                }
                removeImportedGoogleCalendarEvents();
                window.dispatchEvent(
                  new CustomEvent(GOOGLE_CALENDAR_DISCONNECTED_EVENT),
                );
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
        Connecting opens Google so you can approve calendar access (required for
        imports and edits). Disconnect only stops calendar sync in Take &amp;
        Do; if you use Google to sign in, that login stays. Use Reconnect after
        Disconnect so Google issues a token that includes calendar permissions.
      </div>
    </div>
  );
}

function httpErrorMessage(result: ApiResult<unknown>): string | null {
  if (result.ok) return null;
  if (
    result.kind === "http" &&
    result.body &&
    typeof result.body === "object"
  ) {
    const msg = (result.body as { error?: string }).error;
    return typeof msg === "string" && msg.trim() ? msg : null;
  }
  return null;
}
