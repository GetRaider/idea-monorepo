import { httpClient } from "@repo/api/helpers";
import { BadRequestError, HttpError, NotFoundError } from "@/lib/api/errors";

import {
  translationStub,
  type NativeLanguage,
} from "./translation-stub";

type DictionaryApiResponse = Array<{
  word?: string;
  phonetics?: Array<{ text?: string | null }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
}>;

export type DictionaryDetails = {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  translation: string;
};

const cache = new Map<string, { value: DictionaryDetails; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000;

export async function getDictionaryDetails({
  word,
  nativeLanguage,
}: {
  word: string;
  nativeLanguage: NativeLanguage;
}): Promise<DictionaryDetails> {
  const cleanedWord = word.trim();
  if (!cleanedWord) throw new BadRequestError("Missing dictionary word.");

  const cacheKey = `${cleanedWord.toLowerCase()}:${nativeLanguage}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const response = await httpClient.get<DictionaryApiResponse>({
      url: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        cleanedWord,
      )}`,
      headers: {
        Accept: "application/json",
      },
    });

    const entries = response.data;
    const first = entries?.[0];
    const meaning = first?.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition;

    if (!first || !meaning || !definition) {
      throw new NotFoundError("Definition not found.");
    }

    const pronunciation =
      first.phonetics?.map((p) => p.text).find((t) => t && t.trim()) ?? undefined;

    const details: DictionaryDetails = {
      word: first.word ?? cleanedWord,
      pronunciation,
      partOfSpeech: meaning.partOfSpeech,
      definition,
      translation: translationStub({
        word: first.word ?? cleanedWord,
        nativeLanguage,
      }),
    };

    cache.set(cacheKey, { value: details, expiresAt: Date.now() + TTL_MS });
    return details;
  } catch (error) {
    if (error instanceof HttpError) throw error;

    // httpClient throws transport errors; normalize to a 400 so UI can recover.
    throw new BadRequestError(
      "Dictionary lookup failed. Try another word.",
      error instanceof Error ? error.message : undefined,
    );
  }
}

