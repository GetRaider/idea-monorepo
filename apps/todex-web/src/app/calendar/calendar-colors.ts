export const CALENDAR_EVENT_COLORS = [
  "#4f46b8",
  "#2563eb",
  "#0891b2",
  "#0d9488",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#3f3f46",
  "#7c7c86",
  "#d4d4d8",
] as const;

export const DEFAULT_EVENT_COLOR = "#7c7c86";

export const DEFAULT_TASK_COLOR = "#3f3f46";

export function blockColor(kind: "event" | "task", custom: string | null): string {
  return normalizeHex(custom) ?? (kind === "task" ? DEFAULT_TASK_COLOR : DEFAULT_EVENT_COLOR);
}

export function fillIsLight(hex: string): boolean {
  const color = normalizeHex(hex);
  if (!color) return false;
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255 > 0.62;
}

function normalizeHex(value: string | null): string | null {
  if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) return null;
  return value.toLowerCase();
}
