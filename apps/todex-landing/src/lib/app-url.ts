export function getSignInHref(): string {
  const configured = process.env.NEXT_PUBLIC_TODEX_APP_URL?.replace(/\/$/, "");
  const origin =
    configured && configured.length > 0
      ? configured
      : "http://localhost:3002";
  return `${origin}/sign-in`;
}
