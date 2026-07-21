"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TranscriptCue } from "@/server/services/youtube/youtube-transcript.service";
import type { DictionaryDetails } from "@/server/services/dictionary/dictionary.service";
import type { NativeLanguage } from "@/server/services/dictionary/translation-stub";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function DefinitionSheet({
  open,
  onOpenChange,
  nativeLanguage,
  videoId,
  selectedWord,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nativeLanguage: NativeLanguage;
  videoId: string;
  selectedWord: null | {
    wordDisplay: string;
    wordLemma: string;
    contextSentence: string;
    cue: TranscriptCue;
  };
}) {
  const queryClient = useQueryClient();

  const dictionaryQueryKey = useMemo(() => {
    return ["dictionary", selectedWord?.wordLemma ?? "", nativeLanguage] as const;
  }, [nativeLanguage, selectedWord]);

  const dictionaryQuery = useQuery<DictionaryDetails, Error>({
    queryKey: dictionaryQueryKey,
    enabled: open && !!selectedWord,
    queryFn: async () => {
      if (!selectedWord) throw new Error("Missing selected word.");
      const response = await fetch(
        `/api/dictionary/${encodeURIComponent(
          selectedWord.wordLemma,
        )}?nativeLanguage=${encodeURIComponent(nativeLanguage)}`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Dictionary lookup failed.");
      }
      return (await response.json()) as DictionaryDetails;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (dictionary: DictionaryDetails) => {
      if (!selectedWord) throw new Error("Missing selected word.");

      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lemma: selectedWord.wordLemma,
          word: dictionary.word,
          pronunciation: dictionary.pronunciation ?? null,
          partOfSpeech: dictionary.partOfSpeech ?? null,
          definition: dictionary.definition,
          translation: dictionary.translation,
          exampleSentence: selectedWord.contextSentence,
          sourceYoutubeId: videoId,
          sourceSentence: selectedWord.contextSentence,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Already saved from this video.");
        }
        throw new Error(payload?.error ?? "Failed to save word.");
      }
      return payload;
    },
    onSuccess: () => {
      toast.success("Saved to your vocabulary.");
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    },
  });

  const selectedWordLabel = selectedWord?.wordDisplay ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Definition</SheetTitle>
          <SheetDescription>
            Clicked: <span className="font-medium">{selectedWordLabel}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {dictionaryQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : dictionaryQuery.error || !dictionaryQuery.data ? (
            <Card className="p-4">
              <p className="text-sm text-[var(--muted)]">
                {dictionaryQuery.error instanceof Error
                  ? dictionaryQuery.error.message
                  : "Select a word in the subtitles to see its definition."}
              </p>
            </Card>
          ) : (
            <DefinitionContent dictionary={dictionaryQuery.data} />
          )}

          <Separator />

          <Button
            type="button"
            disabled={
              !dictionaryQuery.data || dictionaryQuery.isLoading || !selectedWord
            }
            onClick={() => {
              const dictionary = dictionaryQuery.data;
              if (!dictionary) return;
              saveMutation.mutate(dictionary);
            }}
            className="w-full"
          >
            {saveMutation.isPending ? "Saving..." : "Save word"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DefinitionContent({ dictionary }: { dictionary: DictionaryDetails }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xl font-semibold text-[var(--foreground)]">
          {dictionary.word}
        </h4>
        {dictionary.partOfSpeech ? (
          <Badge variant="secondary">{dictionary.partOfSpeech}</Badge>
        ) : null}
      </div>

      {dictionary.pronunciation ? (
        <p className="text-sm text-[var(--muted)]">
          Pronunciation:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {dictionary.pronunciation}
          </span>
        </p>
      ) : null}

      <div className="space-y-1">
        <div className="text-xs font-semibold text-[var(--muted)]">Meaning</div>
        <p className="text-sm leading-relaxed text-[var(--foreground)]">
          {dictionary.definition}
        </p>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-[var(--muted)]">
          Translation
        </div>
        <p className="text-sm leading-relaxed text-[var(--foreground)]">
          {dictionary.translation}
        </p>
      </div>
    </div>
  );
}

