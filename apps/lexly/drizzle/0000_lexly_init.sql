CREATE TYPE "public"."review_rating" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TABLE "public"."app_settings" (
	"id" integer DEFAULT 1 NOT NULL,
	"native_language" text DEFAULT 'uk' NOT NULL,
	"playback_speed_default" real DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);--> statement-breakpoint
CREATE TABLE "public"."videos" (
	"youtube_id" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"language" text NOT NULL,
	"last_fetched_at" timestamp NOT NULL,
	CONSTRAINT "videos_youtube_id_pkey" PRIMARY KEY ("youtube_id")
);--> statement-breakpoint
CREATE TABLE "public"."saved_words" (
	"id" text NOT NULL,
	"lemma" text NOT NULL,
	"word" text NOT NULL,
	"pronunciation" text,
	"part_of_speech" text,
	"definition" text NOT NULL,
	"translation" text NOT NULL,
	"example_sentence" text NOT NULL,
	"source_youtube_id" text NOT NULL,
	"source_sentence" text NOT NULL,
	"saved_at" timestamp NOT NULL,
	CONSTRAINT "saved_words_pkey" PRIMARY KEY ("id")
);--> statement-breakpoint
ALTER TABLE "public"."saved_words" ADD CONSTRAINT "saved_words_lemma_source_youtube_id_unique" UNIQUE("lemma", "source_youtube_id");--> statement-breakpoint
ALTER TABLE "public"."saved_words" ADD CONSTRAINT "saved_words_source_youtube_id_videos_youtube_id_fk" FOREIGN KEY ("source_youtube_id") REFERENCES "public"."videos"("youtube_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "public"."review_cards" (
	"word_id" text NOT NULL,
	"due_at" timestamp NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"last_rating" "public"."review_rating",
	"last_reviewed_at" timestamp,
	CONSTRAINT "review_cards_word_id_pkey" PRIMARY KEY ("word_id")
);--> statement-breakpoint
ALTER TABLE "public"."review_cards" ADD CONSTRAINT "review_cards_word_id_saved_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."saved_words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

