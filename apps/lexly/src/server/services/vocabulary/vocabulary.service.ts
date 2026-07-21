import { and, desc, eq, like } from "@/db/client";
import { db } from "@/db/client";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import crypto from "crypto";

import {
  savedWordsTable,
  reviewCardsTable,
  videosTable,
} from "@/db/schema";

export type VocabularyWord = {
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
  savedAt: Date;
  sourceTitle?: string | null;
};

export type SaveWordInput = {
  lemma: string;
  word: string;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  definition: string;
  translation: string;
  exampleSentence: string;
  sourceYoutubeId: string;
  sourceSentence: string;
};

export type UpdateTranslationInput = {
  translation: string;
};

export async function listVocabulary({
  q,
  sourceYoutubeId,
}: {
  q?: string;
  sourceYoutubeId?: string;
}): Promise<VocabularyWord[]> {
  const normalizedQ = q?.trim().toLowerCase() ?? "";

  const whereClauses = [];
  if (normalizedQ)
    whereClauses.push(like(savedWordsTable.lemma, `%${normalizedQ}%`));
  if (sourceYoutubeId) whereClauses.push(eq(savedWordsTable.sourceYoutubeId, sourceYoutubeId));

  const rows = await db
    .select({
      id: savedWordsTable.id,
      lemma: savedWordsTable.lemma,
      word: savedWordsTable.word,
      pronunciation: savedWordsTable.pronunciation,
      partOfSpeech: savedWordsTable.partOfSpeech,
      definition: savedWordsTable.definition,
      translation: savedWordsTable.translation,
      exampleSentence: savedWordsTable.exampleSentence,
      sourceYoutubeId: savedWordsTable.sourceYoutubeId,
      sourceSentence: savedWordsTable.sourceSentence,
      savedAt: savedWordsTable.savedAt,
      sourceTitle: videosTable.title,
    })
    .from(savedWordsTable)
    .leftJoin(videosTable, eq(savedWordsTable.sourceYoutubeId, videosTable.youtubeId))
    .where(
      whereClauses.length === 0
        ? undefined
        : whereClauses.length === 1
          ? whereClauses[0]
          : and(...whereClauses),
    )
    .orderBy(desc(savedWordsTable.savedAt));

  return rows;
}

export async function saveWord(input: SaveWordInput): Promise<VocabularyWord> {
  const lemma = input.lemma.trim().toLowerCase();
  const sourceYoutubeId = input.sourceYoutubeId.trim();

  if (!lemma) throw new ConflictError("Missing lemma.");
  if (!sourceYoutubeId) throw new ConflictError("Missing sourceYoutubeId.");

  const existing = await db
    .select()
    .from(savedWordsTable)
    .where(
      and(
        eq(savedWordsTable.lemma, lemma),
        eq(savedWordsTable.sourceYoutubeId, sourceYoutubeId),
      ),
    );

  if (existing[0]) throw new ConflictError("Word already saved from this video.");

  const id = crypto.randomUUID();
  const savedAt = new Date();

  await db.insert(savedWordsTable).values({
    id,
    lemma,
    word: input.word,
    pronunciation: input.pronunciation ?? null,
    partOfSpeech: input.partOfSpeech ?? null,
    definition: input.definition,
    translation: input.translation,
    exampleSentence: input.exampleSentence,
    sourceYoutubeId,
    sourceSentence: input.sourceSentence,
    savedAt,
  });

  await db.insert(reviewCardsTable).values({
    wordId: id,
    dueAt: savedAt,
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
  });

  const [row] = await db
    .select({
      id: savedWordsTable.id,
      lemma: savedWordsTable.lemma,
      word: savedWordsTable.word,
      pronunciation: savedWordsTable.pronunciation,
      partOfSpeech: savedWordsTable.partOfSpeech,
      definition: savedWordsTable.definition,
      translation: savedWordsTable.translation,
      exampleSentence: savedWordsTable.exampleSentence,
      sourceYoutubeId: savedWordsTable.sourceYoutubeId,
      sourceSentence: savedWordsTable.sourceSentence,
      savedAt: savedWordsTable.savedAt,
      sourceTitle: videosTable.title,
    })
    .from(savedWordsTable)
    .leftJoin(videosTable, eq(savedWordsTable.sourceYoutubeId, videosTable.youtubeId))
    .where(eq(savedWordsTable.id, id))
    .limit(1);

  if (!row) throw new NotFoundError("Saved word not found after insert.");
  return row;
}

export async function updateTranslation({
  id,
  translation,
}: {
  id: string;
  translation: string;
}): Promise<VocabularyWord> {
  const existing = await db
    .select()
    .from(savedWordsTable)
    .where(eq(savedWordsTable.id, id));

  if (!existing[0]) throw new NotFoundError("Saved word not found.");

  await db
    .update(savedWordsTable)
    .set({ translation })
    .where(eq(savedWordsTable.id, id));

  const [row] = await db
    .select({
      id: savedWordsTable.id,
      lemma: savedWordsTable.lemma,
      word: savedWordsTable.word,
      pronunciation: savedWordsTable.pronunciation,
      partOfSpeech: savedWordsTable.partOfSpeech,
      definition: savedWordsTable.definition,
      translation: savedWordsTable.translation,
      exampleSentence: savedWordsTable.exampleSentence,
      sourceYoutubeId: savedWordsTable.sourceYoutubeId,
      sourceSentence: savedWordsTable.sourceSentence,
      savedAt: savedWordsTable.savedAt,
      sourceTitle: videosTable.title,
    })
    .from(savedWordsTable)
    .leftJoin(videosTable, eq(savedWordsTable.sourceYoutubeId, videosTable.youtubeId))
    .where(eq(savedWordsTable.id, id))
    .limit(1);

  if (!row) throw new NotFoundError("Saved word not found.");
  return row;
}

export async function deleteWord({ id }: { id: string }): Promise<void> {
  await db.delete(savedWordsTable).where(eq(savedWordsTable.id, id));
}

