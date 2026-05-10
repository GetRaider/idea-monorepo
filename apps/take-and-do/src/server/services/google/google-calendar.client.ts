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
      }),
    )
    .default([]),
  nextSyncToken: z.string().optional(),
});

export type GoogleCalendarEventItem = z.infer<
  typeof GoogleCalendarEventsListResponseSchema
>["items"][number];

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
      `Google Calendar API request failed (${res.status}): ${text || res.statusText}`,
    );
  }

  const json = (await res.json()) as unknown;
  const parsed = GoogleCalendarEventsListResponseSchema.parse(json);
  return { items: parsed.items, nextSyncToken: parsed.nextSyncToken ?? null };
}
