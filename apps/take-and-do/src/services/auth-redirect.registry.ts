import { Route } from "@/constants/route.constant";

export type AuthRedirectHandlers = {
  onUnauthorized: () => void;
  onForbidden: () => void;
};

const defaultHandlers: AuthRedirectHandlers = {
  onUnauthorized: () => {
    if (typeof window !== "undefined") window.location.assign(Route.LOGIN);
  },
  onForbidden: () => {
    if (typeof window !== "undefined") window.location.assign(Route.FORBIDDEN);
  },
};

let handlers: AuthRedirectHandlers = { ...defaultHandlers };

export function setAuthRedirectHandlers(
  next: Partial<AuthRedirectHandlers>,
): void {
  handlers = { ...handlers, ...next };
}

export function resetAuthRedirectHandlers(): void {
  handlers = { ...defaultHandlers };
}

export function getAuthRedirectHandlers(): AuthRedirectHandlers {
  return handlers;
}
