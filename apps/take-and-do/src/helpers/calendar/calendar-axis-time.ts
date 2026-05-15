import type { CalendarAxisTimeZone } from "@/types/calendar.types";

export const AXIS_TZ_LOCAL_SENTINEL = "__local__";

export const AXIS_TZ_DEFAULT_LOCAL_ID = "axis-tz-local";

export function defaultAxisTimeZones(): CalendarAxisTimeZone[] {
  return [
    {
      id: AXIS_TZ_DEFAULT_LOCAL_ID,
      iana: AXIS_TZ_LOCAL_SENTINEL,
      label: null,
    },
  ];
}

export function resolveAxisZoneIana(entry: CalendarAxisTimeZone): string {
  if (entry.iana === AXIS_TZ_LOCAL_SENTINEL) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return entry.iana;
}

export function formatAxisSlotTime(
  date: Date,
  entry: CalendarAxisTimeZone,
  use24h: boolean,
) {
  const iana = resolveAxisZoneIana(entry);
  return new Intl.DateTimeFormat(undefined, {
    hour: use24h ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: !use24h,
    timeZone: iana,
  }).format(date);
}

/** Compact header label; prefer custom label, then short zone names. */
export function formatAxisHeaderLabel(entry: CalendarAxisTimeZone, at: Date) {
  const custom = entry.label?.trim();
  if (custom) return custom;

  const iana = resolveAxisZoneIana(entry);
  const part = (nameStyle: Intl.DateTimeFormatOptions["timeZoneName"]) => {
    const raw = new Intl.DateTimeFormat(undefined, {
      timeZone: iana,
      timeZoneName: nameStyle,
    })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")
      ?.value?.trim();
    return raw ?? "";
  };

  const sg = part("shortGeneric");
  if (sg && sg.length <= 8 && !/^gmt[+-]/i.test(sg)) return sg;

  const sh = part("short");
  if (sh && sh.length <= 8 && !/^gmt[+-]/i.test(sh)) return sh;

  return part("shortOffset") || "—";
}

export function normalizeAxisTimeZones(raw: unknown): CalendarAxisTimeZone[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultAxisTimeZones();

  const out: CalendarAxisTimeZone[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = rec.id;
    const iana = rec.iana;
    if (typeof id !== "string" || !id) continue;
    if (typeof iana !== "string" || !iana) continue;
    out.push({
      id,
      iana,
      label: typeof rec.label === "string" ? rec.label : null,
    });
  }

  return out.length > 0 ? out : defaultAxisTimeZones();
}
