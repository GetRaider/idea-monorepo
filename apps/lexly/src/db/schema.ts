import {
  doublePrecision,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const reviewRatingEnum = pgEnum("review_rating", [
  "again",
  "hard",
  "good",
  "easy",
]);

export const appSettings = pgTable("app_settings", {
  id: integer("id").notNull().primaryKey().default(1),
  nativeLanguage: text("native_language").notNull().default("uk"),
  playbackSpeedDefault: real("playback_speed_default").notNull().default(1),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const videosTable = pgTable(
  "videos",
  {
    youtubeId: text("youtube_id").notNull().primaryKey(),
    title: text("title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    language: text("language").notNull(),
    lastFetchedAt: timestamp("last_fetched_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  () => [],
);

export const savedWordsTable = pgTable(
  "saved_words",
  {
    id: text("id").notNull().primaryKey(),
    lemma: text("lemma").notNull(),
    word: text("word").notNull(),
    pronunciation: text("pronunciation"),
    partOfSpeech: text("part_of_speech"),
    definition: text("definition").notNull(),
    translation: text("translation").notNull(),
    exampleSentence: text("example_sentence").notNull(),
    sourceYoutubeId: text("source_youtube_id")
      .notNull()
      .references(() => videosTable.youtubeId, { onDelete: "cascade" }),
    sourceSentence: text("source_sentence").notNull(),
    savedAt: timestamp("saved_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("saved_words_lemma_source_youtube_id_unique").on(
      table.lemma,
      table.sourceYoutubeId,
    ),
  ],
);

export const reviewCardsTable = pgTable(
  "review_cards",
  {
    wordId: text("word_id").notNull().primaryKey(),
    dueAt: timestamp("due_at")
      .$defaultFn(() => new Date())
      .notNull(),
    intervalDays: integer("interval_days").notNull().default(1),
    easeFactor: doublePrecision("ease_factor").notNull().default(2.5),
    repetitions: integer("repetitions").notNull().default(0),
    lastRating: reviewRatingEnum("last_rating"),
    lastReviewedAt: timestamp("last_reviewed_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.wordId],
      foreignColumns: [savedWordsTable.id],
    }).onDelete("cascade"),
  ],
);

