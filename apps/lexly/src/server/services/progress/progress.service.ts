import { and, eq, gte, gt, isNotNull, lte } from "@/db/client";
import { db } from "@/db/client";

import { savedWordsTable, reviewCardsTable, videosTable } from "@/db/schema";
import { getPracticeSummary, type PracticeSummary } from "../practice/srs-scheduler.service";

export type ProgressResponse = {
  totalSavedWords: number;
  dueCount: number;
  masteredCount: number;
  reviewedThisWeekCount: number;
  practiceSummary: PracticeSummary;
  wordsByVideo: Array<{
    sourceYoutubeId: string;
    count: number;
    title?: string | null;
  }>;
  savedLast7Days: Array<{ day: string; count: number }>;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function getProgress(): Promise<ProgressResponse> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const totalSavedWords = await db
    .select({ id: savedWordsTable.id })
    .from(savedWordsTable);

  const dueCards = await db
    .select({ wordId: reviewCardsTable.wordId })
    .from(reviewCardsTable)
    .where(lte(reviewCardsTable.dueAt, now));

  const masteredCards = await db
    .select({ wordId: reviewCardsTable.wordId })
    .from(reviewCardsTable)
    .where(
      and(
        lte(reviewCardsTable.dueAt, now),
        gt(reviewCardsTable.intervalDays, 21),
      ),
    );

  const reviewedThisWeek = await db
    .select({ lastReviewedAt: reviewCardsTable.lastReviewedAt })
    .from(reviewCardsTable)
    .where(
      and(
        isNotNull(reviewCardsTable.lastReviewedAt),
        gte(reviewCardsTable.lastReviewedAt, weekAgo),
      ),
    );

  const practiceSummary = await getPracticeSummary();

  const wordsByVideoRows = await db
    .select({
      sourceYoutubeId: savedWordsTable.sourceYoutubeId,
      title: videosTable.title,
    })
    .from(savedWordsTable)
    .leftJoin(
      videosTable,
      eq(savedWordsTable.sourceYoutubeId, videosTable.youtubeId),
    );

  const byVideo = new Map<
    string,
    { sourceYoutubeId: string; count: number; title?: string | null }
  >();
  for (const row of wordsByVideoRows) {
    const existing = byVideo.get(row.sourceYoutubeId);
    if (existing) {
      existing.count += 1;
      continue;
    }

    byVideo.set(row.sourceYoutubeId, {
      sourceYoutubeId: row.sourceYoutubeId,
      count: 1,
      title: row.title,
    });
  }

  const wordsByVideo = Array.from(byVideo.values());

  // savedLast7Days for a tiny chart (group in memory)
  const todayStart = startOfDay(now);
  const oldest = addDays(todayStart, -6);
  const savedRows = await db
    .select({ savedAt: savedWordsTable.savedAt })
    .from(savedWordsTable)
    .where(gte(savedWordsTable.savedAt, oldest));

  const countsByDay = new Map<string, number>();
  for (const row of savedRows) {
    const d = startOfDay(new Date(row.savedAt)).toISOString().slice(0, 10);
    countsByDay.set(d, (countsByDay.get(d) ?? 0) + 1);
  }

  const savedLast7Days = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(oldest, i).toISOString().slice(0, 10);
    savedLast7Days.push({ day, count: countsByDay.get(day) ?? 0 });
  }

  return {
    totalSavedWords: totalSavedWords.length,
    dueCount: dueCards.length,
    masteredCount: masteredCards.length,
    reviewedThisWeekCount: reviewedThisWeek.length,
    practiceSummary,
    wordsByVideo,
    savedLast7Days,
  };
}

