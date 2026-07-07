import { Route } from "@/constants/route.constant";

const REGISTERED_ONLY_API_ROUTES: ReadonlySet<Route> = new Set([
  Route.TASKS,
  Route.TASK_BOARDS,
  Route.FOLDERS,
  Route.STATS,
  Route.ANALYTICS,
  Route.FOCUS,
  Route.CALENDAR_EVENTS,
  Route.LABELS,
  Route.INTEGRATIONS_GOOGLE_CALENDAR,
]);

let guestSessionActive = false;

export function setGuestSessionActive(active: boolean): void {
  guestSessionActive = active;
}

export function isGuestSessionActive(): boolean {
  return guestSessionActive;
}

export function assertGuestApiAccessAllowed(route: Route): void {
  if (process.env.NODE_ENV === "production") return;
  if (!guestSessionActive) return;
  if (!REGISTERED_ONLY_API_ROUTES.has(route)) return;

  const message = `Guest session attempted registered-only API route: ${route}`;
  console.error(`[guest-api-dev-guard] ${message}`);
  throw new Error(message);
}
