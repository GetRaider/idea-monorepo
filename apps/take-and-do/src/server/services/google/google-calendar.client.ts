import { z } from "zod";

const GoogleCalendarEventsListResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        summary: z.string().optional(),
        description: z.string().optional(),
        start: z
          .object({
            date: z.string().optional(),
            dateTime: z.string().optional(),
            timeZone: z.string().optional(),
          })
          .optional(),
        end: z
          .object({
            date: z.string().optional(),
            dateTime: z.string().optional(),
            timeZone: z.string().optional(),
          })
          .optional(),
        hangoutLink: z.string().optional(),
        htmlLink: z.string().optional(),
        attendees: z
          .array(
            z.object({
              email: z.string().optional(),
              displayName: z.string().optional(),
              responseStatus: z
                .enum(["needsAction", "declined", "tentative", "accepted"])
                .optional(),
              organizer: z.boolean().optional(),
              self: z.boolean().optional(),
            }),
          )
          .optional(),
        recurringEventId: z.string().optional(),
        originalStartTime: z
          .object({
            date: z.string().optional(),
            dateTime: z.string().optional(),
            timeZone: z.string().optional(),
          })
          .optional(),
        status: z.string().optional(),
      }),
    )
    .default([]),
  nextSyncToken: z.string().optional(),
});

export type GoogleCalendarEventItem = z.infer<
  typeof GoogleCalendarEventsListResponseSchema
>["items"][number];

function googleCalendarApiErrorDetail(text: string, fallback: string): string {
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; errors?: Array<{ message?: string }> };
    };
    return (
      (parsed?.error?.errors?.[0]?.message ?? parsed?.error?.message ?? text) ||
      fallback
    );
  } catch {
    return text || fallback;
  }
}

export async function listGoogleCalendarEvents(params: {
  accessToken: string;
  calendarId: string;
  syncToken?: string | null;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<{
  items: GoogleCalendarEventItem[];
  nextSyncToken: string | null;
}> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events`,
  );

  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", String(params.maxResults ?? 2500));

  if (params.syncToken) {
    url.searchParams.set("syncToken", params.syncToken);
  } else {
    if (params.timeMin) url.searchParams.set("timeMin", params.timeMin);
    if (params.timeMax) url.searchParams.set("timeMax", params.timeMax);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API request failed (${res.status}): ${googleCalendarApiErrorDetail(text, res.statusText)}`,
    );
  }

  const json = (await res.json()) as unknown;
  const parsed = GoogleCalendarEventsListResponseSchema.parse(json);
  return { items: parsed.items, nextSyncToken: parsed.nextSyncToken ?? null };
}

/** Strip read-only fields and merge writable patch keys for Calendar `events.update` (PUT). */
export function mergeGoogleMasterForPut(
  masterRaw: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const omit = new Set([
    "kind",
    "etag",
    "created",
    "updated",
    "htmlLink",
    "hangoutLink",
    "conferenceData",
  ]);
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(masterRaw)) {
    if (omit.has(k)) continue;
    next[k] = v;
  }
  for (const [k, v] of Object.entries(patch)) {
    next[k] = v;
  }
  return next;
}

/** Full replace update — Google recommends PUT (not PATCH-only recurrence) when trimming recurring series. */
export async function updateGoogleCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  googleEventId: string;
  body: Record<string, unknown>;
  etag: string | null;
}): Promise<void> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events/${encodeURIComponent(params.googleEventId)}`,
  );

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
      "If-Match": params.etag?.trim() ? params.etag.trim() : "*",
    },
    body: JSON.stringify(params.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API request failed (${res.status}): ${googleCalendarApiErrorDetail(text, res.statusText)}`,
    );
  }
}

export async function patchGoogleCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  googleEventId: string;
  body: Record<string, unknown>;
}): Promise<void> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events/${encodeURIComponent(params.googleEventId)}`,
  );

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API request failed (${res.status}): ${googleCalendarApiErrorDetail(text, res.statusText)}`,
    );
  }
}

export async function getGoogleCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  googleEventId: string;
}): Promise<{
  raw: Record<string, unknown>;
  etag: string | null;
}> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events/${encodeURIComponent(params.googleEventId)}`,
  );

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API request failed (${res.status}): ${googleCalendarApiErrorDetail(text, res.statusText)}`,
    );
  }

  const json = (await res.json()) as unknown;
  const etag =
    res.headers.get("ETag") ??
    res.headers.get("etag") ??
    (typeof json === "object" &&
    json !== null &&
    "etag" in json &&
    typeof (json as { etag?: unknown }).etag === "string"
      ? (json as { etag: string }).etag
      : null);

  return {
    raw: json as Record<string, unknown>,
    etag,
  };
}

export async function postGoogleCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  body: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events`,
  );

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API request failed (${res.status}): ${googleCalendarApiErrorDetail(text, res.statusText)}`,
    );
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function deleteGoogleCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  googleEventId: string;
}): Promise<void> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events/${encodeURIComponent(params.googleEventId)}`,
  );
  url.searchParams.set("sendUpdates", "none");

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API request failed (${res.status}): ${googleCalendarApiErrorDetail(text, res.statusText)}`,
    );
  }
}
