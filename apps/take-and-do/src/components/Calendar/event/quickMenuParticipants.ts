import { CALENDAR_STORAGE_KEY } from "@/hooks/calendar/calendar-storage";
import { localStorageHelper } from "@/helpers/local-storage.helper";

export function parseParticipantCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getCalendarParticipantSuggest(
  isTask: boolean,
  participantsText: string,
): { token: string; list: string[] } {
  if (isTask) return { token: "", list: [] };
  const raw = participantsText;
  const lastComma = raw.lastIndexOf(",");
  const token = (lastComma >= 0 ? raw.slice(lastComma + 1) : raw).trim();
  const q = token.toLowerCase();
  const base = (() => {
    const parsed = localStorageHelper.readItem(CALENDAR_STORAGE_KEY) as {
      events?: unknown[];
    } | null;
    if (!parsed || !Array.isArray(parsed.events)) return [] as string[];
    const out: string[] = [];
    for (const event of parsed.events) {
      if (
        event &&
        typeof event === "object" &&
        (event as { type?: unknown }).type !== "task"
      ) {
        const parts = (event as { participants?: unknown }).participants;
        if (Array.isArray(parts)) {
          for (const participant of parts) {
            if (typeof participant === "string" && participant.trim()) {
              out.push(participant.trim());
            }
          }
        }
      }
    }
    return Array.from(new Set(out)).sort();
  })();
  const list = q
    ? base
        .filter((participant) => participant.toLowerCase().includes(q))
        .slice(0, 8)
    : base.slice(0, 8);
  return { token, list };
}
