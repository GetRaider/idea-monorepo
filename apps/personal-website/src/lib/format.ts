import type { YearMonth } from "@/data/experience";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatYearMonth({ year, month }: YearMonth): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** "Sep 2024 – Present" */
export function formatDateRange(
  start: YearMonth,
  end: YearMonth | null,
): string {
  return `${formatYearMonth(start)} – ${end ? formatYearMonth(end) : "Present"}`;
}

export function toIsoMonth({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://getadev.xyz"
).replace(/\/$/, "");
