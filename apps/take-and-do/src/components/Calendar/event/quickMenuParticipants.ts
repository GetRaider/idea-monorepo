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
    if (typeof window === "undefined") return [] as string[];
    try {
      const rawStorage = window.localStorage.getItem("take-and-do:calendar:v1");
      if (!rawStorage) return [] as string[];
      const parsed = JSON.parse(rawStorage) as { events?: unknown[] } | null;
      if (!parsed || !Array.isArray(parsed.events)) return [] as string[];
      const out: string[] = [];
      for (const ev of parsed.events) {
        if (
          ev &&
          typeof ev === "object" &&
          (ev as { type?: unknown }).type !== "task"
        ) {
          const parts = (ev as { participants?: unknown }).participants;
          if (Array.isArray(parts)) {
            for (const p of parts) {
              if (typeof p === "string" && p.trim()) out.push(p.trim());
            }
          }
        }
      }
      return Array.from(new Set(out)).sort();
    } catch {
      return [] as string[];
    }
  })();
  const list = q
    ? base.filter((p) => p.toLowerCase().includes(q)).slice(0, 8)
    : base.slice(0, 8);
  return { token, list };
}
