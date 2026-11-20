export function getAppHref(): string {
  return process.env.NEXT_PUBLIC_TODEX_APP_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production" ? "https://todex.app" : "http://localhost:3002");
}

export function getSignInHref(): string {
  return `${getAppHref()}/sign-in`;
}
