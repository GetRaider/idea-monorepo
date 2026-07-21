import {
  asc,
  and,
  eq,
  gte,
  gt,
  isNotNull,
  lte,
  lt,
} from "@/db/client";
import { db } from "@/db/client";
import { NotFoundError } from "@/lib/api/errors";

import {
  reviewCardsTable,
  savedWordsTable,
} from "@/db/schema";

export type PracticeDirection = "en-to-native" | "native-to-en";

export type PracticeCard = {
  wordId: string;
  prompt: string;
  answer: string;
  word: string;
  translation: string;
  definition: string;
  exampleSentence: string;
};

export type PracticeSummary = {
  dueCount: number;
  reviewedTodayCount: number;
  streakDays: number;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function computeNextSchedule({
  current,
  rating,
}: {
  current: {
    intervalDays: number;
    easeFactor: number;
    repetitions: number;
  };
  rating: "again" | "hard" | "good" | "easy";
}): {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
} {
  const minEaseFactor = 1.3;

  if (rating === "again") {
    return {
      intervalDays: 1,
      easeFactor: Math.max(minEaseFactor, current.easeFactor - 0.2),
      repetitions: 0,
    };
  }

  if (rating === "hard") {
    return {
      intervalDays: Math.max(1, Math.round(current.intervalDays * 1.2)),
      easeFactor: Math.max(minEaseFactor, current.easeFactor - 0.1),
      repetitions: current.repetitions + 1,
    };
  }

  if (rating === "easy") {
    return {
      intervalDays: Math.max(1, Math.round(current.intervalDays * current.easeFactor * 1.3)),
      easeFactor: current.easeFactor + 0.15,
      repetitions: current.repetitions + 1,
    };
  }

  return {
    intervalDays: Math.max(1, Math.round(current.intervalDays * current.easeFactor)),
    easeFactor: current.easeFactor,
    repetitions: current.repetitions + 1,
  };
}

export async function getPracticeSession({
  direction,
  limit = 20,
}: {
  direction: PracticeDirection;
  limit?: number;
}): Promise<PracticeCard[]> {
  const now = new Date();

  const rows = await db
    .select({
      wordId: reviewCardsTable.wordId,
      dueAt: reviewCardsTable.dueAt,
      intervalDays: reviewCardsTable.intervalDays,
      easeFactor: reviewCardsTable.easeFactor,
      repetitions: reviewCardsTable.repetitions,
      lastRating: reviewCardsTable.lastRating,
      word: savedWordsTable.word,
      translation: savedWordsTable.translation,
      definition: savedWordsTable.definition,
      exampleSentence: savedWordsTable.exampleSentence,
    })
    .from(reviewCardsTable)
    .innerJoin(savedWordsTable, eq(reviewCardsTable.wordId, savedWordsTable.id))
    .where(lte(reviewCardsTable.dueAt, now))
    .orderBy(asc(reviewCardsTable.dueAt))
    .limit(limit);

  return rows.map((row) => {
    if (direction === "en-to-native") {
      return {
        wordId: row.wordId,
        prompt: row.word,
        answer: row.translation,
        word: row.word,
        translation: row.translation,
        definition: row.definition,
        exampleSentence: row.exampleSentence,
      };
    }

    return {
      wordId: row.wordId,
      prompt: row.translation,
      answer: row.word,
      word: row.word,
      translation: row.translation,
      definition: row.definition,
      exampleSentence: row.exampleSentence,
    };
  });
}

export async function reviewCard({
  wordId,
  rating,
}: {
  wordId: string;
  rating: "again" | "hard" | "good" | "easy";
}): Promise<void> {
  const now = new Date();

  const existing = await db
    .select()
    .from(reviewCardsTable)
    .where(eq(reviewCardsTable.wordId, wordId));

  if (!existing[0]) throw new NotFoundError("Review card not found.");

  const next = computeNextSchedule({
    current: {
      intervalDays: existing[0].intervalDays,
      easeFactor: Number(existing[0].easeFactor),
      repetitions: existing[0].repetitions,
    },
    rating,
  });

  const dueAt = addDays(now, next.intervalDays);

  await db
    .update(reviewCardsTable)
    .set({
      dueAt,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      repetitions: next.repetitions,
      lastRating: rating,
      lastReviewedAt: now,
    })
    .where(eq(reviewCardsTable.wordId, wordId));
}

export async function getPracticeSummary(): Promise<PracticeSummary> {
  const now = new Date();
  const dueCount = await db
    .select({ count: reviewCardsTable.wordId })
    .from(reviewCardsTable)
    .where(lte(reviewCardsTable.dueAt, now));

  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  const reviewedTodayRows = await db
    .select()
    .from(reviewCardsTable)
    .where(
      and(
        isNotNull(reviewCardsTable.lastReviewedAt),
        gte(reviewCardsTable.lastReviewedAt, todayStart),
        lt(reviewCardsTable.lastReviewedAt, tomorrowStart),
      ),
    );

  // streak: consecutive days with at least 1 review ending today
  const windowStart = addDays(todayStart, -30);
  const reviewedWindow = await db
    .select({ lastReviewedAt: reviewCardsTable.lastReviewedAt })
    .from(reviewCardsTable)
    .where(
      and(
        isNotNull(reviewCardsTable.lastReviewedAt),
        gt(reviewCardsTable.lastReviewedAt, windowStart),
      ),
    );

  const dates = new Set(
    reviewedWindow
      .map((row) => row.lastReviewedAt)
      .filter((d) => d !== null && d !== undefined)
      .map((d) => startOfDay(new Date(d)).toISOString()),
  );

  let streakDays = 0;
  for (;;) {
    const day = addDays(todayStart, -streakDays).toISOString();
    if (!dates.has(day)) break;
    streakDays += 1;
  }

  return {
    dueCount: dueCount.length,
    reviewedTodayCount: reviewedTodayRows.length,
    streakDays,
  };
}

