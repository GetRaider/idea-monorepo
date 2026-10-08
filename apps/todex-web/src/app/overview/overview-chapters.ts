export const OVERVIEW_CANVAS_ID = "overview-canvas";

export const OVERVIEW_CHAPTERS = [
  { id: "today", label: "Today" },
  { id: "continue-work", label: "Continue Work" },
  { id: "upcoming", label: "Upcoming" },
  { id: "needs-organizing", label: "Needs Organizing" },
  { id: "recent-docs", label: "Recent Docs" },
] as const;

export type OverviewChapterId = (typeof OVERVIEW_CHAPTERS)[number]["id"];
