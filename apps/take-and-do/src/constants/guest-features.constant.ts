export const GUEST_STORE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const GUEST_FEATURES = {
  workspace: true,
  calendar: true,
  focus: true,
  overview: true,
  boardHealth: true,
  recentTasks: true,
  customDateViews: true,
  publicWorkspaces: true,
  googleCalendar: false,
  ai: false,
} as const;

export type AppFeature = keyof typeof GUEST_FEATURES;

const GUEST_FEATURE_DISABLED_MESSAGES: Partial<Record<AppFeature, string>> = {
  ai: "AI features are not available for guest users. Please sign in to use them.",
  googleCalendar:
    "Google Calendar is not available for guest users. Please sign in to connect.",
  focus: "Focus sessions are not available for guest users.",
  calendar: "Calendar is not available for guest users.",
  workspace: "Workspace features are not available for guest users.",
  overview: "Overview is not available for guest users.",
  boardHealth: "Board health is not available for guest users.",
  recentTasks: "Recent tasks are not available for guest users.",
  customDateViews: "Custom date views are not available for guest users.",
  publicWorkspaces: "Public workspaces are not available for guest users.",
};

export function guestFeatureDisabledMessage(feature: AppFeature): string {
  return (
    GUEST_FEATURE_DISABLED_MESSAGES[feature] ??
    "This feature is not available for guest users."
  );
}
