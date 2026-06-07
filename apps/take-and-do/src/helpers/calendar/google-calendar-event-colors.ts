import { normalizeHexColor } from "./calendar-colors";

export type GoogleCalendarColorDefinition = {
  background: string;
  foreground: string;
};

export type GoogleCalendarColorPalettes = {
  event: Readonly<Record<string, GoogleCalendarColorDefinition>>;
  calendar: Readonly<Record<string, GoogleCalendarColorDefinition>>;
};

/**
 * Fallback when Colors API is unavailable — modern event palette.
 * @see https://developers.google.com/workspace/calendar/api/v3/reference/colors
 */
export const GOOGLE_EVENT_COLOR_HEX_BY_ID: Readonly<Record<string, string>> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6bf26",
  "6": "#f4511e",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#d50000",
};

export function googleColorIdKey(
  colorId: string | number | undefined | null,
): string | undefined {
  if (colorId == null) return undefined;
  const key = String(colorId).trim();
  return key.length > 0 ? key : undefined;
}

export function googleEventColorIdToHex(
  colorId: string | number | undefined | null,
  palettes?: GoogleCalendarColorPalettes,
): string | undefined {
  const key = googleColorIdKey(colorId);
  if (!key) return undefined;
  const fromApi = palettes?.event[key]?.background;
  if (fromApi) return normalizeHexColor(fromApi);
  return normalizeHexColor(GOOGLE_EVENT_COLOR_HEX_BY_ID[key]);
}

export function googleCalendarColorIdToHex(
  colorId: string | number | undefined | null,
  palettes?: GoogleCalendarColorPalettes,
): string | undefined {
  const key = googleColorIdKey(colorId);
  if (!key) return undefined;
  const fromApi = palettes?.calendar[key]?.background;
  if (fromApi) return normalizeHexColor(fromApi);
  return normalizeHexColor(GOOGLE_EVENT_COLOR_HEX_BY_ID[key]);
}

function hexToRgbChannels(hex: string): [number, number, number] | undefined {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return undefined;
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbDistanceSquared(
  left: [number, number, number],
  right: [number, number, number],
): number {
  const redDelta = left[0] - right[0];
  const greenDelta = left[1] - right[1];
  const blueDelta = left[2] - right[2];
  return redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta;
}

/** Map a UI hex to the nearest Google event `colorId` (1–11). */
export function hexToGoogleEventColorId(
  hex: string,
  palettes?: GoogleCalendarColorPalettes,
): string | undefined {
  const targetRgb = hexToRgbChannels(hex);
  if (!targetRgb) return undefined;

  const candidates = palettes?.event
    ? Object.entries(palettes.event)
    : Object.entries(GOOGLE_EVENT_COLOR_HEX_BY_ID);

  let bestId: string | undefined;
  let bestDistance = Infinity;
  for (const [id, value] of candidates) {
    const candidateHex = typeof value === "string" ? value : value.background;
    const candidateRgb = hexToRgbChannels(candidateHex);
    if (!candidateRgb) continue;
    const distance = rgbDistanceSquared(targetRgb, candidateRgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = id;
    }
  }
  return bestId;
}

export function googleEventColorPatchFromHex(
  hex: string | null | undefined,
  palettes?: GoogleCalendarColorPalettes,
): Record<string, unknown> {
  if (hex === null) return { colorId: null };
  if (hex === undefined) return {};
  const colorId = hexToGoogleEventColorId(hex, palettes);
  return colorId ? { colorId } : {};
}
