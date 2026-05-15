function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function splitDatetimeLocalParts(value: string): {
  date: string;
  time: string;
} {
  const date = value.length >= 10 ? value.slice(0, 10) : "";
  const time = value.length >= 16 ? value.slice(11, 16) : "00:00";
  return { date, time };
}

export function joinDatetimeLocalParts(date: string, time: string) {
  const raw = time && time.length >= 4 ? time.slice(0, 5) : "00:00";
  const [h, m] = raw.split(":");
  const hh = pad2(Number.parseInt(h || "0", 10) || 0);
  const mm = pad2(Number.parseInt(m || "0", 10) || 0);
  return `${date}T${hh}:${mm}`;
}

export function formatTimeDisplay(d: Date, use24h: boolean) {
  if (use24h) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatWeekdayMonthDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function durationLabelMs(ms: number) {
  const m = Math.max(1, Math.round(ms / 60000));
  return `${m}min`;
}
