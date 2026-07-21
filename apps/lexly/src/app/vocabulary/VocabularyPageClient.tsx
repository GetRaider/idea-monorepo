"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type VocabularyWord = {
  id: string;
  lemma: string;
  word: string;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  definition: string;
  translation: string;
  exampleSentence: string;
  sourceYoutubeId: string;
  sourceSentence: string;
  savedAt: string;
  sourceTitle?: string | null;
};

async function fetchVocabulary({
  q,
  sourceYoutubeId,
}: {
  q?: string;
  sourceYoutubeId?: string;
}): Promise<VocabularyWord[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (sourceYoutubeId?.trim()) params.set("sourceYoutubeId", sourceYoutubeId.trim());

  const response = await fetch(`/api/vocabulary?${params.toString()}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to load vocabulary.");
  }
  return response.json();
}

export function VocabularyPageClient() {
  const queryClient = useQueryClient();

  const [searchQ, setSearchQ] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [activeQ, setActiveQ] = useState("");
  const [activeSourceFilter, setActiveSourceFilter] = useState("");

  const vocabularyQuery = useQuery({
    queryKey: ["vocabulary", activeQ, activeSourceFilter],
    queryFn: () =>
      fetchVocabulary({
        q: activeQ,
        sourceYoutubeId: activeSourceFilter,
      }),
    enabled: true,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editWord, setEditWord] = useState<VocabularyWord | null>(null);
  const [editDraftTranslation, setEditDraftTranslation] = useState("");

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; translation: string }) => {
      const response = await fetch(`/api/vocabulary/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translation: payload.translation }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update translation.");
      }
      return data as VocabularyWord;
    },
    onSuccess: () => {
      toast.success("Translation saved.");
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    },
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const response = await fetch(`/api/vocabulary/${wordId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete word.");
      }
    },
    onSuccess: () => {
      toast.success("Word deleted.");
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      setDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    },
  });

  const words = vocabularyQuery.data ?? [];

  const emptyState = useMemo(() => {
    if (vocabularyQuery.isLoading) return null;
    if (words.length) return null;

    const parts = [];
    if (activeQ.trim()) parts.push(`“${activeQ.trim()}”`);
    if (activeSourceFilter.trim()) parts.push(`video ${activeSourceFilter.trim()}`);

    const filterText = parts.length ? ` for ${parts.join(" + ")}` : "";
    return `No saved words${filterText}. Save a word from the Watch page to start practicing.`;
  }, [activeQ, activeSourceFilter, vocabularyQuery.isLoading, words.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            My Vocabulary
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Search, edit translations, and delete words you no longer want.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_auto] md:items-end">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--muted)]">
              Search
            </div>
            <Input
              value={searchQ}
              placeholder="English word or lemma"
              onChange={(event) => setSearchQ(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--muted)]">
              Filter by YouTube ID
            </div>
            <Input
              value={sourceFilter}
              placeholder="e.g. qz0aGYrrlhU"
              onChange={(event) => setSourceFilter(event.target.value)}
            />
          </div>

          <Button
            type="button"
            onClick={() => {
              setActiveQ(searchQ);
              setActiveSourceFilter(sourceFilter);
            }}
          >
            Apply
          </Button>
        </div>
      </Card>

      {vocabularyQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : vocabularyQuery.isError ? (
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">
            {vocabularyQuery.error instanceof Error
              ? vocabularyQuery.error.message
              : "Failed to load vocabulary."}
          </p>
        </Card>
      ) : emptyState ? (
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">{emptyState}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <Card
              key={word.id}
              className="p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-[var(--foreground)]">
                      {word.word}
                    </div>
                    {word.partOfSpeech ? (
                      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
                        {word.partOfSpeech}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {word.translation}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Saved:{" "}
                    {new Date(word.savedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditWord(word);
                      setEditDraftTranslation(word.translation);
                      setEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteWordId(word.id);
                      setDeleteOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3 text-sm text-[var(--muted)]">
                Example from video: {word.exampleSentence}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditWord(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit translation</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-[var(--muted)]">
              {editWord ? `Word: ${editWord.word}` : null}
            </div>
            <Input
              value={editDraftTranslation}
              onChange={(event) => setEditDraftTranslation(event.target.value)}
              placeholder="Native language translation"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!editWord || editMutation.isPending}
                onClick={() => {
                  if (!editWord) return;
                  editMutation.mutate({
                    id: editWord.id,
                    translation: editDraftTranslation.trim(),
                  });
                }}
              >
                {editMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this word?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-[var(--muted)]">
            This removes it from your vocabulary storage and practice schedule.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteWordId || deleteMutation.isPending}
              onClick={() => {
                if (!deleteWordId) return;
                deleteMutation.mutate(deleteWordId);
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

