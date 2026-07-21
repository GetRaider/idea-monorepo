"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type {
  PracticeCard,
  PracticeDirection,
  PracticeSummary,
} from "@/server/services/practice/srs-scheduler.service";

async function fetchPracticeSession(direction: PracticeDirection) {
  const response = await fetch(
    `/api/practice/session?direction=${encodeURIComponent(direction)}`,
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load practice session.");
  }
  return payload as PracticeCard[];
}

async function fetchPracticeSummary() {
  const response = await fetch(`/api/practice/summary`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load practice summary.");
  }
  return payload as PracticeSummary;
}

async function reviewCardApi({
  wordId,
  rating,
}: {
  wordId: string;
  rating: "again" | "hard" | "good" | "easy";
}) {
  const response = await fetch(`/api/practice/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordId, rating }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Review failed.");
  }
}

export function PracticePageClient() {
  const queryClient = useQueryClient();

  const [direction, setDirection] = useState<PracticeDirection>("en-to-native");
  const [reveal, setReveal] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["practice-session", direction],
    queryFn: () => fetchPracticeSession(direction),
  });

  const summaryQuery = useQuery({
    queryKey: ["practice-summary"],
    queryFn: fetchPracticeSummary,
  });

  const currentCard = sessionQuery.data?.[0] ?? null;

  useEffect(() => {
    setReveal(false);
  }, [direction, currentCard?.wordId]);

  const reviewMutation = useMutation({
    mutationFn: reviewCardApi,
    onSuccess: async () => {
      toast.success("Marked review.");
      setReveal(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["practice-session"] }),
        queryClient.invalidateQueries({ queryKey: ["practice-summary"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Review failed.");
    },
  });

  const dueCount = summaryQuery.data?.dueCount ?? 0;

  const directionLabel =
    direction === "en-to-native" ? "English → Native" : "Native → English";

  const dueBadgeText = dueCount === 1 ? "1 due word" : `${dueCount} due words`;

  const isBusy = sessionQuery.isLoading || summaryQuery.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Practice
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Quick flashcards with lightweight spaced repetition.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{dueBadgeText}</Badge>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={direction === "en-to-native" ? "default" : "outline"}
            onClick={() => setDirection("en-to-native")}
          >
            English → Native
          </Button>
          <Button
            type="button"
            variant={direction === "native-to-en" ? "default" : "outline"}
            onClick={() => setDirection("native-to-en")}
          >
            Native → English
          </Button>
          <div className="ml-auto text-sm text-[var(--muted)]">
            {directionLabel}
          </div>
        </div>
      </Card>

      {isBusy ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      ) : sessionQuery.isError ? (
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">
            {sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : "Failed to load session."}
          </p>
        </Card>
      ) : !currentCard ? (
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">
            You&apos;re all caught up for this direction. Come back
            later when more words are due.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--muted)]">
                  Prompt
                </div>
                <div className="text-3xl font-semibold text-[var(--foreground)]">
                  {currentCard.prompt}
                </div>
              </div>
              <Badge variant="secondary">{direction === "en-to-native" ? "EN → NATIVE" : "NATIVE → EN"}</Badge>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-[var(--muted)]">
                Answer
              </div>
              {reveal ? (
                <div className="text-xl font-medium text-[var(--foreground)]">
                  {currentCard.answer}
                </div>
              ) : (
                <div className="text-sm text-[var(--muted)]">
                  Reveal to check the translation.
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-[var(--muted)]">
              Example: {currentCard.exampleSentence}
            </div>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!reveal ? (
              <Button type="button" onClick={() => setReveal(true)}>
                Reveal answer
              </Button>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reviewMutation.isPending}
                    onClick={() => {
                      reviewMutation.mutate({
                        wordId: currentCard.wordId,
                        rating: "again",
                      });
                    }}
                  >
                    Again
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reviewMutation.isPending}
                    onClick={() => {
                      reviewMutation.mutate({
                        wordId: currentCard.wordId,
                        rating: "hard",
                      });
                    }}
                  >
                    Hard
                  </Button>
                  <Button
                    type="button"
                    disabled={reviewMutation.isPending}
                    onClick={() => {
                      reviewMutation.mutate({
                        wordId: currentCard.wordId,
                        rating: "good",
                      });
                    }}
                  >
                    Good
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    disabled={reviewMutation.isPending}
                    onClick={() => {
                      reviewMutation.mutate({
                        wordId: currentCard.wordId,
                        rating: "easy",
                      });
                    }}
                  >
                    Easy
                  </Button>
                </div>
                <div className="ml-auto text-sm text-[var(--muted)]">
                  Due words: {dueCount}
                </div>
              </>
            )}
          </div>

          <div className="text-xs text-[var(--muted)]">
            Streak: {summaryQuery.data?.streakDays ?? 0} day(s)
          </div>
        </div>
      )}
    </div>
  );
}

