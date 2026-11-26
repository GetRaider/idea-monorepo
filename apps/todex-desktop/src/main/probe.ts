import http from "node:http";
import https from "node:https";

const REQUEST_TIMEOUT_MS = 15_000;

// Liveness probe for the local stack. This shell does not call the Todex API,
// so it does not go through @repo/api's HttpClient.
export function probeUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      finish(false);
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      finish(false);
      return;
    }
    const client = parsed.protocol === "https:" ? https : http;
    const request = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : undefined,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        timeout: REQUEST_TIMEOUT_MS,
        agent: false,
      },
      (response) => {
        response.resume();
        const status = response.statusCode ?? 0;
        finish(status >= 200 && status < 300);
      },
    );
    request.on("timeout", () => {
      request.destroy();
      finish(false);
    });
    request.on("error", () => finish(false));
    request.end();
  });
}
