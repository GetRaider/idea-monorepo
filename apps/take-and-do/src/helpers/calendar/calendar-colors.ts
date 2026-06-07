import type { CalendarEvent, CalendarEventType } from "@/types/calendar.types";

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";

export type CalendarColorTheme = {
  internalCalendarColor?: string;
  googleCalendarColor?: string;
};

export function normalizeHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(t)) return undefined;
  return t.toLowerCase();
}

function srgbChannelToLinear(u: number): number {
  return u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance in [0, 1], or `undefined` if `hex` is not `#rrggbb`. */
function relativeLuminanceFromHex(hex: string): number | undefined {
  const n = normalizeHexColor(hex);
  if (!n) return undefined;
  const r = srgbChannelToLinear(parseInt(n.slice(1, 3), 16) / 255);
  const g = srgbChannelToLinear(parseInt(n.slice(3, 5), 16) / 255);
  const b = srgbChannelToLinear(parseInt(n.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Max luminance for event fills so default white/zinc labels stay readable. */
const MAX_LUMINANCE_FOR_WHITE_LABELS = 0.55;

export function hexIsReadableWithWhiteText(hex: string): boolean {
  const L = relativeLuminanceFromHex(hex);
  return L != null && L <= MAX_LUMINANCE_FOR_WHITE_LABELS;
}

function toHex2(v: number): string {
  const x = Math.max(0, Math.min(255, Math.round(v)));
  return x.toString(16).padStart(2, "0");
}

/**
 * Darkens sRGB (multiplicative) until luminance is low enough for white text, or returns a slate fallback.
 */
export function coerceHexToWhiteTextSafe(hex: string): string {
  const n = normalizeHexColor(hex);
  if (!n) return "#475569";
  if (hexIsReadableWithWhiteText(n)) return n;
  let r = parseInt(n.slice(1, 3), 16);
  let g = parseInt(n.slice(3, 5), 16);
  let b = parseInt(n.slice(5, 7), 16);
  for (let i = 0; i < 36; i++) {
    r = Math.round(r * 0.9);
    g = Math.round(g * 0.9);
    b = Math.round(b * 0.9);
    const cand = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
    if (hexIsReadableWithWhiteText(cand)) return cand;
  }
  return "#334155";
}

const PRESET_CANDIDATE_HEXES: readonly string[] = [
  "#b45353",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#78716c",
  "#64748b",
  "#94a3b8",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#c4b5fd",
  "#fda4af",
  "#fdba74",
  "#a3e635",
  "#2dd4bf",
  "#b91c1c",
  "#c2410c",
  "#a16207",
  "#854d0e",
  "#166534",
  "#14532d",
  "#0f766e",
  "#0e7490",
  "#075985",
  "#1d4ed8",
  "#4338ca",
  "#5b21b6",
  "#6b21a8",
  "#86198f",
  "#9f1239",
  "#3f3f46",
  "#334155",
  "#1e293b",
  "#7f1d1d",
  "#9a3412",
  "#713f12",
  "#365314",
  "#134e4a",
  "#164e63",
  "#1e3a8a",
  "#312e81",
  "#4c1d95",
  "#831843",
];

/** Presets guaranteed readable with the grid’s white / zinc event labels. */
export const CALENDAR_PRESET_HEXES: readonly string[] = Array.from(
  new Set(
    PRESET_CANDIDATE_HEXES.filter(
      (h) => normalizeHexColor(h) && hexIsReadableWithWhiteText(h),
    ),
  ),
);

export const DEFAULT_INTERNAL_CALENDAR_CHROME_HEX = "#4f46b8";

export const DEFAULT_GOOGLE_CALENDAR_CHROME_HEX = "#0d9488";

export function effectiveInternalCalendarColor(
  internalCalendarColor: string | undefined,
): string {
  return (
    normalizeHexColor(internalCalendarColor) ??
    DEFAULT_INTERNAL_CALENDAR_CHROME_HEX
  );
}

export function effectiveGoogleCalendarColor(
  googleCalendarColor: string | undefined,
): string {
  return (
    normalizeHexColor(googleCalendarColor) ?? DEFAULT_GOOGLE_CALENDAR_CHROME_HEX
  );
}

export function calendarEventUsesGoogleChrome(
  eventId: string,
  kind: CalendarEventType,
  commonUsesGoogle?: boolean,
): boolean {
  if (eventId.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)) return true;
  return kind === "common" && commonUsesGoogle === true;
}

/** Calendar chrome for the left stripe — never the per-event override. */
export function calendarChromeHex(
  event: CalendarEvent,
  opts: CalendarColorTheme,
): string {
  if (event.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)) {
    return effectiveGoogleCalendarColor(opts.googleCalendarColor);
  }
  return effectiveInternalCalendarColor(opts.internalCalendarColor);
}

export function calendarChromeHexForDraft(opts: {
  kind: CalendarEventType;
  commonUsesGoogle?: boolean;
  theme?: CalendarColorTheme;
}): string {
  const theme = opts.theme ?? {};
  if (calendarEventUsesGoogleChrome("", opts.kind, opts.commonUsesGoogle)) {
    return effectiveGoogleCalendarColor(theme.googleCalendarColor);
  }
  return effectiveInternalCalendarColor(theme.internalCalendarColor);
}

/** Darken sRGB channels for the event body (left stripe uses calendar chrome only). */
export function darkenHexSrgb(hex: string, factor: number): string {
  const n = normalizeHexColor(hex);
  if (!n) return "#334155";
  const clamped = Math.max(0, Math.min(1, factor));
  let r = parseInt(n.slice(1, 3), 16);
  let g = parseInt(n.slice(3, 5), 16);
  let b = parseInt(n.slice(5, 7), 16);
  r = Math.round(r * clamped);
  g = Math.round(g * clamped);
  b = Math.round(b * clamped);
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

export function chromeToFillHex(chromeHex: string): string {
  return coerceHexToWhiteTextSafe(darkenHexSrgb(chromeHex, 0.72));
}

/** FullCalendar body fill — per-event color when set, else darker calendar chrome. */
export function eventFillHex(
  event: CalendarEvent,
  opts: CalendarColorTheme,
): string {
  const custom = normalizeHexColor(event.color);
  const bodyBase = custom ?? calendarChromeHex(event, opts);
  return chromeToFillHex(bodyBase);
}

/** All grid events use the left accent stripe + darker body split. */
export function eventUsesCalendarStripe(
  _event: CalendarEvent,
  _opts: CalendarColorTheme,
): boolean {
  return true;
}
