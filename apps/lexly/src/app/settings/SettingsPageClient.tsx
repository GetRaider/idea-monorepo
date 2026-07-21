"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  supportedNativeLanguages,
  type NativeLanguage,
} from "@/server/services/dictionary/translation-stub";

async function fetchSettings() {
  const response = await fetch("/api/settings");
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load settings.");
  }
  return payload as { nativeLanguage: NativeLanguage; playbackSpeedDefault: number };
}

async function patchSettings({
  nativeLanguage,
  playbackSpeedDefault,
}: Partial<{ nativeLanguage: NativeLanguage; playbackSpeedDefault: number }>) {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nativeLanguage, playbackSpeedDefault }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to save settings.");
  }
  return payload;
}

export function SettingsPageClient() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage>("uk");
  const [playbackSpeedDefault, setPlaybackSpeedDefault] = useState<number>(1);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setNativeLanguage(settingsQuery.data.nativeLanguage);
    setPlaybackSpeedDefault(settingsQuery.data.playbackSpeedDefault);
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      patchSettings({ nativeLanguage, playbackSpeedDefault }),
    onSuccess: () => {
      toast.success("Settings saved.");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    },
  });

  const isLoading = settingsQuery.isLoading;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          Settings
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Choose your native language and your default playback speed.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : settingsQuery.isError ? (
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">
            {settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "Failed to load settings."}
          </p>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--muted)]">
                Native language
              </div>
              <select
                value={nativeLanguage}
                onChange={(event) =>
                  setNativeLanguage(event.target.value as NativeLanguage)
                }
                className="h-10 w-full rounded-lg border border-input bg-white/60 px-3 text-sm outline-none focus:border-[var(--primary)]"
              >
                {supportedNativeLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--muted)]">
                Default playback speed
              </div>
              <Input
                type="number"
                step={0.25}
                min={0.5}
                max={3}
                value={playbackSpeedDefault}
                onChange={(event) =>
                  setPlaybackSpeedDefault(Number(event.target.value))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

