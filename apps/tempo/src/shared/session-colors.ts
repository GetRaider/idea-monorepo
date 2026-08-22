export const SESSION_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#eab308",
] as const;

export const DEFAULT_SESSION_COLOR = SESSION_COLORS[0];

export type SessionColor = (typeof SESSION_COLORS)[number];
