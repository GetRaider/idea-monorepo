import { HttpError } from "@/lib/api/errors";

import {
  getGoogleCalendarEvent,
  listGoogleCalendarEventInstances,
  mergeGoogleMasterForPut,
  patchGoogleCalendarEvent,
  postGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "./google-calendar.client";
import {
  mergeGoogleSplitGroupMarker,
  readGoogleSplitGroupId,
  resolveGoogleSplitGroupId,
} from "./google-calendar-split-lineage";

export type GoogleFollowingSplitMeta = {
  originalStart: string;
  originalAllDay: boolean;
  /** From Google `originalStartTime.timeZone` when present. */
  timeZone?: string;
};

/** Master id for following split — always from the clicked instance payload. */
export function resolveFollowingMasterIdFromInstance(
  instanceRaw: Record<string, unknown>,
  fallbackMasterId: string,
): string {
  const recurringEventId = instanceRaw.recurringEventId;
  if (typeof recurringEventId === "string" && recurringEventId.trim()) {
    return recurringEventId.trim();
  }
  return fallbackMasterId;
}

/** End recurring master before `meta` occurrence (no new tail). */
export async function truncateGoogleCalendarSeriesBefore(params: {
  accessToken: string;
  calendarId: string;
  masterId: string;
  meta: GoogleFollowingSplitMeta;
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

  const originalRecurrence = recurrenceRaw.map((rule) =>
    typeof rule === "string" ? rule : String(rule),
  );

  const trimmedRecurrence = originalRecurrence.map((rule) =>
    addUntilBeforeTarget(rule, params.meta),
  );

  const splitGroupId = resolveGoogleSplitGroupId(master, params.masterId);

  const putBody = mergeGoogleMasterForPut(master, {
    recurrence: trimmedRecurrence,
    ...mergeGoogleSplitGroupMarker(master, splitGroupId),
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
  meta: GoogleFollowingSplitMeta;
  patchBody: Record<string, unknown>;
}): Promise<void> {
  const masterGet = await getGoogleCalendarEvent({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    googleEventId: params.masterId,
  });

  const master = masterGet.raw;
  const splitGroupId = resolveGoogleSplitGroupId(master, params.masterId);
  const isNestedSplit = !!readGoogleSplitGroupId(master);

  await truncateGoogleCalendarSeriesBefore({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    masterId: params.masterId,
    meta: params.meta,
    masterSnapshot: master,
    masterEtag: masterGet.etag,
  });

  await cancelTruncatedMasterInstancesAfterAnchor({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    masterId: params.masterId,
    meta: params.meta,
  });

  const recurrenceRaw = master.recurrence;
  const originalRecurrence = Array.isArray(recurrenceRaw)
    ? recurrenceRaw.map((rule) =>
        typeof rule === "string" ? rule : String(rule),
      )
    : [];

  const tailRecurrence = recurrenceRulesForNewTail(
    originalRecurrence,
    params.meta,
  );

  const newBody = buildTailSeriesBody(
    master,
    params.patchBody,
    tailRecurrence,
    splitGroupId,
    { omitICalUID: isNestedSplit },
  );

  await postGoogleCalendarEvent({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    body: newBody,
  });
}

/** Cancel instances still attached to a truncated master at/after the split anchor. */
export async function cancelTruncatedMasterInstancesAfterAnchor(params: {
  accessToken: string;
  calendarId: string;
  masterId: string;
  meta: GoogleFollowingSplitMeta;
}): Promise<void> {
  const anchorMs = splitAnchorUtcMs(params.meta);
  if (anchorMs == null) return;

  const timeMin = new Date(anchorMs).toISOString();
  const instances = await listGoogleCalendarEventInstances({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    recurringEventId: params.masterId,
    timeMin,
  });

  for (const instance of instances) {
    if (instance.status === "cancelled" || !instance.id) continue;
    const instanceAnchorMs = readInstanceOriginalStartMs(instance, params.meta);
    if (instanceAnchorMs == null || instanceAnchorMs < anchorMs) continue;

    await patchGoogleCalendarEvent({
      accessToken: params.accessToken,
      calendarId: params.calendarId,
      googleEventId: instance.id,
      body: { status: "cancelled" },
    });
  }
}

function readInstanceOriginalStartMs(
  instance: {
    originalStartTime?: {
      date?: string;
      dateTime?: string;
    };
  },
  meta: GoogleFollowingSplitMeta,
): number | null {
  const ost = instance.originalStartTime;
  if (!ost) return null;
  if (meta.originalAllDay && typeof ost.date === "string") {
    return Date.parse(`${ost.date.trim()}T12:00:00Z`);
  }
  if (typeof ost.dateTime === "string") {
    const parsedMs = Date.parse(ost.dateTime.trim());
    return Number.isNaN(parsedMs) ? null : parsedMs;
  }
  return null;
}

/** Read `originalStartTime` from a Google recurring instance payload. */
export function resolveGoogleInstanceOriginalStartMeta(
  instanceRaw: Record<string, unknown>,
): GoogleFollowingSplitMeta | null {
  const ost = instanceRaw.originalStartTime;
  if (!ost || typeof ost !== "object") return null;
  const dateTime = (ost as { dateTime?: string }).dateTime;
  const date = (ost as { date?: string }).date;
  const timeZone = (ost as { timeZone?: string }).timeZone?.trim();
  if (typeof date === "string" && date.trim() && !dateTime) {
    return { originalStart: date.trim(), originalAllDay: true };
  }
  if (typeof dateTime === "string" && dateTime.trim()) {
    return {
      originalStart: dateTime.trim(),
      originalAllDay: false,
      ...(timeZone ? { timeZone } : {}),
    };
  }
  return null;
}

/** Tail series keeps the RRULE pattern but must not inherit an old UNTIL/COUNT. */
export function recurrenceRulesForNewTail(
  rules: string[],
  meta?: GoogleFollowingSplitMeta,
): string[] {
  const anchorMs = meta ? splitAnchorUtcMs(meta) : null;

  return rules
    .map((rule) => {
      if (/^RRULE:/i.test(rule)) {
        const core = rule.replace(/^RRULE:/i, "").trim();
        const parts = core
          .split(";")
          .filter(Boolean)
          .filter((part) => !/^UNTIL=/i.test(part) && !/^COUNT=/i.test(part));
        return `RRULE:${parts.join(";")}`;
      }
      if (/^EXDATE:/i.test(rule) && anchorMs != null) {
        return filterExdateRuleBeforeAnchor(rule, meta!, anchorMs);
      }
      return rule;
    })
    .filter(
      (rule): rule is string => typeof rule === "string" && rule.length > 0,
    );
}

function addUntilBeforeTarget(
  rule: string,
  meta: GoogleFollowingSplitMeta,
): string {
  if (!/^RRULE:/i.test(rule)) return rule;

  const untilValue = meta.originalAllDay
    ? untilDateAllDayBefore(meta.originalStart)
    : untilUtcTimedBefore(meta.originalStart);

  return insertOrReplaceUntil(rule, untilValue);
}

export function splitAnchorUtcMs(
  meta: GoogleFollowingSplitMeta,
): number | null {
  if (meta.originalAllDay) {
    const ymd = meta.originalStart.trim().slice(0, 10);
    const parsedMs = Date.parse(`${ymd}T12:00:00Z`);
    return Number.isNaN(parsedMs) ? null : parsedMs;
  }
  const parsedMs = Date.parse(meta.originalStart);
  return Number.isNaN(parsedMs) ? null : parsedMs;
}

function filterExdateRuleBeforeAnchor(
  rule: string,
  meta: GoogleFollowingSplitMeta,
  anchorMs: number,
): string | null {
  const payload = rule.replace(/^EXDATE(?:;[^:]*)?:/i, "").trim();
  if (!payload) return null;

  const kept: string[] = [];
  for (const token of payload.split(",")) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (meta.originalAllDay) {
      const ymd = trimmed.slice(0, 8);
      const anchorYmd = meta.originalStart.slice(0, 10).replace(/-/g, "");
      if (ymd >= anchorYmd) kept.push(trimmed);
      continue;
    }
    const parsedMs = Date.parse(
      /^\d{8}T\d{6}Z$/i.test(trimmed)
        ? `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}T${trimmed.slice(9, 11)}:${trimmed.slice(11, 13)}:${trimmed.slice(13, 15)}Z`
        : trimmed,
    );
    if (!Number.isNaN(parsedMs) && parsedMs >= anchorMs) kept.push(trimmed);
  }

  if (kept.length === 0) return null;
  return `EXDATE:${kept.join(",")}`;
}

function untilUtcTimedBefore(originalStart: string): string {
  const parsedMs = Date.parse(originalStart);
  if (Number.isNaN(parsedMs)) {
    throw new HttpError(400, "Invalid recurring original start time.");
  }
  const cutoff = new Date(parsedMs - 1000);
  return formatRruleUntilUtc(cutoff);
}

function untilDateAllDayBefore(originalStartYmd: string): string {
  const ymd = originalStartYmd.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
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

function formatRruleUntilUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${mo}${day}T${h}${min}${s}Z`;
}

function insertOrReplaceUntil(rule: string, until: string): string {
  const core = rule.replace(/^RRULE:/i, "").trim();
  const parts = core.split(";").filter(Boolean);
  const filtered = parts.filter(
    (part) => !/^UNTIL=/i.test(part) && !/^COUNT=/i.test(part),
  );
  filtered.push(`UNTIL=${until}`);
  return `RRULE:${filtered.join(";")}`;
}

const TAIL_COPY_FROM_MASTER = [
  "summary",
  "description",
  "location",
  "transparency",
  "visibility",
  "attendees",
  "organizer",
  "reminders",
  "guestsCanInviteOthers",
  "guestsCanSeeOtherGuests",
  "guestsCanModify",
  "anyoneCanAddSelf",
  "source",
  "eventType",
] as const;

export function buildTailSeriesBody(
  master: Record<string, unknown>,
  patchBody: Record<string, unknown>,
  tailRecurrence: string[],
  splitGroupId: string,
  opts?: { omitICalUID?: boolean },
): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const key of TAIL_COPY_FROM_MASTER) {
    if (key in master) base[key] = master[key];
  }

  const isNestedSplit = opts?.omitICalUID ?? !!readGoogleSplitGroupId(master);
  const masterICalUID = master.iCalUID;
  if (
    !isNestedSplit &&
    typeof masterICalUID === "string" &&
    masterICalUID.trim()
  ) {
    base.iCalUID = masterICalUID.trim();
  }

  const masterSequence = master.sequence;
  if (typeof masterSequence === "number" && Number.isFinite(masterSequence)) {
    base.sequence = masterSequence + 1;
  }

  const { recurrence: _omitRecurrence, ...patchWithoutRecurrence } = patchBody;

  return {
    ...base,
    ...patchWithoutRecurrence,
    recurrence: tailRecurrence,
    ...mergeGoogleSplitGroupMarker(master, splitGroupId),
  };
}
