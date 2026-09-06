const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * 60;

const TOKEN_PATTERN =
  /(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m)\b/gi;

export function parseEstimation(input: string): number | null {
  const normalized = input.trim().replace(/,/g, " ").replace(/\band\b/gi, " ");
  if (!normalized) return null;

  let totalMinutes = 0;
  let matched = false;
  for (const match of normalized.matchAll(TOKEN_PATTERN)) {
    matched = true;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount < 0) return null;
    totalMinutes += amount * minutesForUnit(match[2] ?? "");
  }

  if (!matched) return null;
  return Math.round(totalMinutes);
}

export function formatEstimation(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return "";

  const days = Math.floor(minutes / MINUTES_PER_DAY);
  const hours = Math.floor((minutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const remainingMinutes = minutes % MINUTES_PER_HOUR;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
  return parts.join(" ");
}

function minutesForUnit(unit: string): number {
  const normalized = unit.toLowerCase();
  if (normalized.startsWith("d")) return MINUTES_PER_DAY;
  if (normalized.startsWith("h")) return MINUTES_PER_HOUR;
  return 1;
}
