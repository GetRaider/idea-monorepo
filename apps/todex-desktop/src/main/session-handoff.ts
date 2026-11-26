import http from "node:http";

export const DESKTOP_HANDOFF_HOST = "127.0.0.1";
export const DESKTOP_HANDOFF_PORT = 47321;
export const SESSION_COOKIE_NAME = "better-auth.session_token";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function readSessionHandoff(requestUrl: string): SessionHandoff | null {
  let parsed: URL;
  try {
    parsed = new URL(
      requestUrl,
      `http://${DESKTOP_HANDOFF_HOST}:${DESKTOP_HANDOFF_PORT}`,
    );
  } catch {
    return null;
  }
  if (parsed.pathname !== "/callback") return null;
  const state = parsed.searchParams.get("state");
  const session = parsed.searchParams.get("session");
  if (!state || !session) return null;
  return { state, session };
}

export function startSessionHandoffServer(
  accept: (sessionToken: string) => Promise<boolean>,
): http.Server {
  const server = http.createServer((request, response) => {
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }
    const handoff = readSessionHandoff(request.url ?? "");
    if (!handoff) {
      response.writeHead(404).end();
      return;
    }
    void accept(handoff.session)
      .then((accepted) => {
        if (!accepted) {
          response.writeHead(409).end("No Todex sign-in is in progress.");
          return;
        }
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(
          "<!doctype html><title>Todex</title><p>Signed in. You can close this tab and return to Todex.</p>",
        );
      })
      .catch(() => {
        response.writeHead(500).end();
      });
  });
  server.listen(DESKTOP_HANDOFF_PORT, DESKTOP_HANDOFF_HOST);
  return server;
}

export function sessionCookieExpiration(): number {
  return Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
}

export type SessionHandoff = {
  state: string;
  session: string;
};
