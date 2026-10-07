"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui";
import { toast } from "sonner";

import { linkSocial, useSession } from "@lib/auth-client";
import { todexClient } from "@lib/todex-client";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function GoogleCalendarSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = useSession();
  const statusQuery = useQuery({
    queryKey: ["calendar-google"],
    queryFn: () => todexClient.calendar.google.status(),
  });
  const google = statusQuery.data ?? null;
  const syncGoogle = useMutation({
    mutationFn: todexClient.calendar.google.sync,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["calendar-google"] }),
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] }),
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Google Calendar sync failed"),
  });
  const disconnectGoogle = useMutation({
    mutationFn: todexClient.calendar.google.disconnect,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar-google"] }),
  });
  const googleFlag = searchParams.get("google");
  const googleReturnStarted = useRef(false);

  useEffect(() => {
    if (!googleFlag || googleReturnStarted.current) return;
    googleReturnStarted.current = true;
    if (googleFlag === "error") {
      toast.error("Google did not grant calendar access. Try Connect again.");
      router.replace("/settings");
      return;
    }
    if (googleFlag !== "connect") return;
    void syncGoogle.mutateAsync().finally(() => router.replace("/settings"));
  }, [googleFlag, router, syncGoogle]);

  const status = googleStatus(google);

  return (
    <section className="mt-6 max-w-lg rounded-xl border border-border p-4">
      <h2 className="text-sm font-medium">Google Calendar</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Todex is the calendar. Connect Google to mirror events you organize, and
        to show events you do not organize as read-only.
      </p>
      <p className="mt-3 text-sm">{status}</p>
      {google?.lastSyncAt ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Last sync {new Date(google.lastSyncAt).toLocaleString()}
        </p>
      ) : null}
      {google?.lastError ? (
        <p className="mt-2 text-xs text-destructive">{google.lastError}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={syncGoogle.isPending || sessionPending}
          onClick={() => {
            if (!session?.user) {
              toast.error("Sign in with Google before connecting a calendar");
              window.location.assign("/sign-in");
              return;
            }
            if (google?.needsConsent || !google?.connected) {
              const origin = window.location.origin;
              void linkSocial({
                provider: "google",
                callbackURL: `${origin}/settings?google=connect`,
                errorCallbackURL: `${origin}/settings?google=error`,
                scopes: [CALENDAR_SCOPE],
              }).then((result) => {
                if (result.error) {
                  toast.error(result.error.message || "Could not connect Google Calendar");
                  return;
                }
                if (result.data?.url) window.location.assign(result.data.url);
              });
              return;
            }
            void syncGoogle.mutateAsync();
          }}
        >
          {google?.enabled ? "Sync" : "Connect"}
        </Button>
        {google?.enabled ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disconnectGoogle.isPending}
            onClick={() => void disconnectGoogle.mutateAsync()}
          >
            Disconnect
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function googleStatus(
  google: {
    connected: boolean;
    enabled: boolean;
    needsConsent: boolean;
  } | null,
) {
  if (!google) return "Checking Google Calendar…";
  if (google.enabled) return "Sync is on. Edits you organize write back to Google.";
  if (!google.connected || google.needsConsent) {
    return "Google Calendar is off. Nothing is pulled or pushed until you connect.";
  }
  return "Google is connected. Sync is off until you turn it on.";
}
