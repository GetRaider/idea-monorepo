"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import type { ProgressResponse } from "@/server/services/progress/progress.service";

async function fetchProgress(): Promise<ProgressResponse> {
  const response = await fetch("/api/progress");
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load progress.");
  }
  return payload as ProgressResponse;
}

export function ProgressPageClient() {
  const progressQuery = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
  });

  if (progressQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (progressQuery.isError || !progressQuery.data) {
    return (
      <Card className="p-4">
        <p className="text-sm text-[var(--muted)]">
          {progressQuery.error instanceof Error
            ? progressQuery.error.message
            : "Failed to load progress."}
        </p>
      </Card>
    );
  }

  const { totalSavedWords, dueCount, masteredCount, reviewedThisWeekCount, practiceSummary, wordsByVideo, savedLast7Days } =
    progressQuery.data;

  const maxSaved = Math.max(...savedLast7Days.map((d) => d.count), 1);

  const masteryRate =
    totalSavedWords === 0 ? 0 : Math.round((masteredCount / totalSavedWords) * 100);

  const barHeights = ["h-6", "h-8", "h-10", "h-12", "h-14", "h-16"] as const;
  function barHeightClass(count: number): string {
    const ratio = count / maxSaved;
    const level = Math.min(
      barHeights.length - 1,
      Math.max(0, Math.round(ratio * (barHeights.length - 1))),
    );
    return barHeights[level] ?? "h-6";
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          Progress
        </h2>
        <p className="text-sm text-[var(--muted)]">
          A lightweight dashboard for your Lexly practice loop.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-[var(--muted)]">
            Total saved
          </div>
          <div className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
            {totalSavedWords}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-[var(--muted)]">
            Due now
          </div>
          <div className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
            {dueCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-[var(--muted)]">
            Mastered
          </div>
          <div className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
            {masteredCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-[var(--muted)]">
            Reviewed this week
          </div>
          <div className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
            {reviewedThisWeekCount}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--muted)]">
              Mastery rate
            </div>
            <div className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {masteryRate}% mastered
            </div>
          </div>
          <Badge variant="secondary">{practiceSummary.streakDays} day streak</Badge>
        </div>
        <div className="mt-3">
          <Progress value={masteryRate} />
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[var(--muted)]">
              Saved words (last 7 days)
            </div>
            <div className="text-xs text-[var(--muted)]">
              Total: {savedLast7Days.reduce((acc, d) => acc + d.count, 0)}
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2">
            {savedLast7Days.map((day) => (
              <div key={day.day} className="flex-1">
                <div
                  className={`rounded-md bg-[var(--primary)]/20 ${barHeightClass(day.count)}`}
                />
                <div className="mt-2 text-[10px] text-center text-[var(--muted)]">
                  {day.day.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-[var(--muted)]">
            Source videos
          </div>
          <div className="mt-3 space-y-2">
            {wordsByVideo.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">
                Save words from the Watch page to populate this list.
              </div>
            ) : (
              wordsByVideo
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((video) => (
                  <div
                    key={video.sourceYoutubeId}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[var(--foreground)]">
                        {video.title ?? "Video"}
                      </div>
                      <div className="text-xs font-mono text-[var(--muted)]">
                        {video.sourceYoutubeId}
                      </div>
                    </div>
                    <Badge variant="secondary">{video.count}</Badge>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

