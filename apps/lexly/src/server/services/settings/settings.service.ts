import { eq } from "@/db/client";
import { db } from "@/db/client";
import { BadRequestError } from "@/lib/api/errors";

import { appSettings } from "@/db/schema";
import type { NativeLanguage } from "../dictionary/translation-stub";

export type LexlySettings = {
  nativeLanguage: NativeLanguage;
  playbackSpeedDefault: number;
};

export async function getSettings(): Promise<LexlySettings> {
  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);

  if (!existing[0]) {
    const now = new Date();
    await db.insert(appSettings).values({
      id: 1,
      nativeLanguage: "uk",
      playbackSpeedDefault: 1,
      createdAt: now,
      updatedAt: now,
    });
    return { nativeLanguage: "uk", playbackSpeedDefault: 1 };
  }

  return {
    nativeLanguage: existing[0].nativeLanguage as NativeLanguage,
    playbackSpeedDefault: Number(existing[0].playbackSpeedDefault),
  };
}

export async function updateSettings({
  nativeLanguage,
  playbackSpeedDefault,
}: Partial<LexlySettings>): Promise<LexlySettings> {
  const current = await getSettings();
  const nextNativeLanguage = nativeLanguage ?? current.nativeLanguage;
  const nextPlaybackSpeedDefault =
    playbackSpeedDefault ?? current.playbackSpeedDefault;

  if (nextPlaybackSpeedDefault <= 0 || nextPlaybackSpeedDefault > 3) {
    throw new BadRequestError("Playback speed must be between 0 and 3.");
  }

  const now = new Date();
  await db
    .update(appSettings)
    .set({
      nativeLanguage: nextNativeLanguage,
      playbackSpeedDefault: nextPlaybackSpeedDefault,
      updatedAt: now,
    })
    .where(eq(appSettings.id, 1));

  return {
    nativeLanguage: nextNativeLanguage,
    playbackSpeedDefault: nextPlaybackSpeedDefault,
  };
}

