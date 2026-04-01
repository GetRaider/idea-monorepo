export type AuthRedirectHandlers = {
  onUnauthorized: () => void;
  onForbidden: () => void;
};

const defaultHandlers: AuthRedirectHandlers = {
  onUnauthorized: () => {
    if (typeof window !== "undefined") window.location.assign("/login");
  },
  onForbidden: () => {
    if (typeof window !== "undefined") window.location.assign("/forbidden");
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
