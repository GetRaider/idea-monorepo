import type { DropdownOption } from "@/components/Dropdown";

const FALLBACK_TIMEZONES: string[] = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Warsaw",
  "Europe/Kyiv",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
];

/** Stable offset + zone names (e.g. `GMT+04:00` with colon). */
const DISPLAY_LOCALE = "en-GB";

function supportedTimeZones(): string[] {
  const intlAny = Intl as unknown as {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const values = intlAny.supportedValuesOf?.("timeZone");
  if (Array.isArray(values) && values.length > 0) return values;
  return FALLBACK_TIMEZONES;
}

function timeZoneNamePart(
  iana: string,
  at: Date,
  style: Intl.DateTimeFormatOptions["timeZoneName"],
): string {
  try {
    return (
      new Intl.DateTimeFormat(DISPLAY_LOCALE, {
        timeZone: iana,
        timeZoneName: style,
      })
        .formatToParts(at)
        .find((p) => p.type === "timeZoneName")
        ?.value?.trim() ?? ""
    );
  } catch {
    return "";
  }
}

function formatLongOffset(iana: string, at: Date): string {
  return (
    timeZoneNamePart(iana, at, "longOffset") ||
    timeZoneNamePart(iana, at, "shortOffset") ||
    "—"
  );
}

/** Full zone name, e.g. `Gulf Standard Time`, `Central European Standard Time`. */
function formatLongZoneName(iana: string, at: Date): string {
  return (
    timeZoneNamePart(iana, at, "long") ||
    timeZoneNamePart(iana, at, "longGeneric") ||
    ""
  );
}

function effectiveLongZoneDisplayName(iana: string, at: Date): string {
  return formatLongZoneName(iana, at) || iana;
}

/**
 * Device zone row label, e.g. `Central European Time (Your Location)`.
 */
export function formatDeviceTimeZoneYourLocationLabel(
  at: Date = new Date(),
): string {
  const iana = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  return `${effectiveLongZoneDisplayName(iana, at)} (Your Location)`;
}

function normalizeComparable(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Stable identity for “same wall timezone” at `at` (offset + official name).
 * Used to dedupe list rows and to match stored IANA to the canonical list row.
 */
export function timeZoneListIdentityKey(iana: string, at: Date): string {
  const offset = formatLongOffset(iana, at);
  const timeName = formatLongZoneName(iana, at);
  const offN = normalizeComparable(offset);
  const nameN = normalizeComparable(timeName);
  if (!timeName || nameN === offN) {
    return `${offN}||${iana}`;
  }
  return `${offN}|${nameN}`;
}

function uniqueIanaZonesPreservingOrder(zones: string[], at: Date): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const iana of zones) {
    const k = timeZoneListIdentityKey(iana, at);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(iana);
  }
  return out;
}

/** Parse `GMT`, `GMT+1`, `GMT+01:00`, `GMT-05:30` → minutes east of UTC. */
function parseLongOffsetToMinutes(longOffset: string): number {
  const t = longOffset.trim().replace(/\u2212/g, "-");
  if (/^GMT$/i.test(t)) return 0;
  const m = t.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/i);
  if (!m) return Number.POSITIVE_INFINITY;
  const sign = m[1] === "-" ? -1 : 1;
  const h = parseInt(m[2]!, 10);
  const min = m[3] ? parseInt(m[3]!, 10) : 0;
  return sign * (h * 60 + min);
}

function sortUniqueZones(zones: string[], at: Date): string[] {
  return [...zones].sort((a, b) => {
    const offA = parseLongOffsetToMinutes(formatLongOffset(a, at));
    const offB = parseLongOffsetToMinutes(formatLongOffset(b, at));
    if (offA !== offB) return offA - offB;
    const nameA = formatLongZoneName(a, at);
    const nameB = formatLongZoneName(b, at);
    const cmp = nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return a.localeCompare(b);
  });
}

/**
 * List label: `GMT+01:00 (Central European Standard Time)`.
 * When Intl has no separate long name (e.g. some `Etc/*`), falls back to the IANA id in parens.
 */
export function formatTimeZoneOptionLabel(
  iana: string,
  at: Date = new Date(),
): string {
  if (iana === "") {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    return buildTimeZoneListLine(local, at);
  }
  return buildTimeZoneListLine(iana, at);
}

function buildTimeZoneListLine(iana: string, at: Date): string {
  const offset = formatLongOffset(iana, at);
  const timeName = formatLongZoneName(iana, at);
  if (
    !timeName ||
    normalizeComparable(timeName) === normalizeComparable(offset)
  ) {
    return `${offset} (${iana})`;
  }
  return `${offset} (${timeName})`;
}

let cachedOptionsMinute: number | null = null;
let cachedOptions: DropdownOption<string>[] | null = null;

export function timeZoneOptions(): DropdownOption<string>[] {
  const minute = Math.floor(Date.now() / 60_000);
  if (cachedOptions && cachedOptionsMinute === minute) return cachedOptions;

  const at = new Date();
  const zones = sortUniqueZones(
    uniqueIanaZonesPreservingOrder(supportedTimeZones(), at),
    at,
  );
  cachedOptionsMinute = minute;
  cachedOptions = [
    { value: "", label: formatTimeZoneOptionLabel("", at) },
    ...zones.map((tz) => ({
      value: tz,
      label: formatTimeZoneOptionLabel(tz, at),
    })),
  ];
  return cachedOptions;
}
