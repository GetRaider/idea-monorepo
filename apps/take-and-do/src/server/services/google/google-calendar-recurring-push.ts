import { HttpError } from "@/lib/api/errors";

import {
  getGoogleCalendarEvent,
  mergeGoogleMasterForPut,
  postGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "./google-calendar.client";

/** End recurring master before `meta` occurrence (no new tail). */
export async function truncateGoogleCalendarSeriesBefore(params: {
  accessToken: string;
  calendarId: string;
  masterId: string;
  meta: {
    originalStart: string;
    originalAllDay: boolean;
  };
  /** When set together with `masterEtag`, skips a redundant GET before PUT. */
  masterSnapshot?: Record<string, unknown>;
  masterEtag?: string | null;
}): Promise<void> {
  let master = params.masterSnapshot;
  let etag = params.masterEtag ?? null;
  if (!master || etag == null) {
    const got = await getGoogleCalendarEvent({
      accessToken: params.accessToken,
      calendarId: params.calendarId,
      googleEventId: params.masterId,
    });
    master = master ?? got.raw;
    etag = etag ?? got.etag;
  }

  const recurrenceRaw = master.recurrence;
  if (!Array.isArray(recurrenceRaw) || recurrenceRaw.length === 0) {
    throw new HttpError(
      400,
      "Could not update series: recurring master has no recurrence rules.",
    );
  }

  const originalRecurrence = recurrenceRaw.map((r) =>
    typeof r === "string" ? r : String(r),
  );

  const trimmedRecurrence = originalRecurrence.map((rule) =>
    addUntilBeforeTarget(rule, params.meta),
  );

  const putBody = mergeGoogleMasterForPut(master, {
    recurrence: trimmedRecurrence,
  });

  await updateGoogleCalendarEvent({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    googleEventId: params.masterId,
    body: putBody,
    etag,
  });
}

export async function pushGoogleCalendarFollowingSplit(params: {
  accessToken: string;
  calendarId: string;
  masterId: string;
  meta: {
    originalStart: string;
    originalAllDay: boolean;
  };
  patchBody: Record<string, unknown>;
}): Promise<void> {
  const masterGet = await getGoogleCalendarEvent({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    googleEventId: params.masterId,
  });

  const master = masterGet.raw;

  await truncateGoogleCalendarSeriesBefore({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    masterId: params.masterId,
    meta: params.meta,
    masterSnapshot: master,
    masterEtag: masterGet.etag,
  });

  const recurrenceRaw = master.recurrence;
  const originalRecurrence = Array.isArray(recurrenceRaw)
    ? recurrenceRaw.map((r) => (typeof r === "string" ? r : String(r)))
    : [];

  const newBody = buildTailSeriesBody(
    master,
    params.patchBody,
    originalRecurrence,
  );

  await postGoogleCalendarEvent({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    body: newBody,
  });
}

function addUntilBeforeTarget(
  rule: string,
  meta: { originalStart: string; originalAllDay: boolean },
): string {
  if (!/^RRULE:/i.test(rule)) return rule;

  const untilValue = meta.originalAllDay
    ? untilDateAllDayBefore(meta.originalStart)
    : untilUtcTimedBefore(meta.originalStart);

  return insertOrReplaceUntil(rule, untilValue);
}

function untilUtcTimedBefore(originalStart: string): string {
  const d = new Date(originalStart);
  if (Number.isNaN(d.getTime())) {
    throw new HttpError(400, "Invalid recurring original start time.");
  }
  const cutoff = new Date(d.getTime() - 1000);
  return formatRruleUntilUtc(cutoff);
}

function untilDateAllDayBefore(originalStartYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(originalStartYmd.trim());
  if (!m) {
    throw new HttpError(400, "Invalid recurring original start date.");
  }
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  dt.setUTCDate(dt.getUTCDate() - 1);
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}${mo}${day}`;
}

function formatRruleUntilUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${mo}${day}T${h}${min}${s}Z`;
}

function insertOrReplaceUntil(rule: string, until: string): string {
  const core = rule.replace(/^RRULE:/i, "").trim();
  const parts = core.split(";").filter(Boolean);
  const filtered = parts.filter(
    (p) => !/^UNTIL=/i.test(p) && !/^COUNT=/i.test(p),
  );
  filtered.push(`UNTIL=${until}`);
  return `RRULE:${filtered.join(";")}`;
}

const MASTER_OMIT_FOR_INSERT = new Set([
  "id",
  "recurringEventId",
  "originalStartTime",
  "htmlLink",
  "created",
  "updated",
  "etag",
  "kind",
  "iCalUID",
  "hangoutLink",
  "conferenceData",
]);

function buildTailSeriesBody(
  master: Record<string, unknown>,
  patchBody: Record<string, unknown>,
  originalRecurrence: string[],
): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(master)) {
    if (MASTER_OMIT_FOR_INSERT.has(k)) continue;
    base[k] = v;
  }

  return {
    ...base,
    summary: patchBody.summary,
    description: patchBody.description,
    start: patchBody.start,
    end: patchBody.end,
    recurrence: originalRecurrence,
  };
}
