import { listGoogleCalendarEvents } from "./google-calendar.client";

/** Shared extended property — links head/tail masters after API series splits. */
export const GOOGLE_SPLIT_GROUP_PROP = "takeAndDoSplitGroupId";

export function readGoogleSplitGroupId(
  raw: Record<string, unknown>,
): string | undefined {
  const extendedProperties = raw.extendedProperties;
  if (!extendedProperties || typeof extendedProperties !== "object") {
    return undefined;
  }
  const shared = (extendedProperties as { shared?: Record<string, unknown> })
    .shared;
  if (!shared || typeof shared !== "object") return undefined;
  const value = shared[GOOGLE_SPLIT_GROUP_PROP];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function mergeGoogleSplitGroupMarker(
  master: Record<string, unknown>,
  splitGroupId: string,
): Record<string, unknown> {
  const extendedProperties = master.extendedProperties;
  const existing =
    extendedProperties && typeof extendedProperties === "object"
      ? (extendedProperties as {
          shared?: Record<string, unknown>;
          private?: Record<string, unknown>;
        })
      : undefined;

  return {
    extendedProperties: {
      ...(existing?.private ? { private: existing.private } : {}),
      shared: {
        ...(existing?.shared ?? {}),
        [GOOGLE_SPLIT_GROUP_PROP]: splitGroupId,
      },
    },
  };
}

export function resolveGoogleSplitGroupId(
  master: Record<string, unknown>,
  masterId: string,
): string {
  return readGoogleSplitGroupId(master) ?? masterId;
}

export async function listGoogleCalendarRecurringMasterIdsBySplitGroup(params: {
  accessToken: string;
  calendarId: string;
  splitGroupId: string;
}): Promise<string[]> {
  const { items } = await listGoogleCalendarEvents({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    singleEvents: false,
    sharedExtendedProperty: `${GOOGLE_SPLIT_GROUP_PROP}=${params.splitGroupId}`,
    timeMin: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return items
    .filter(
      (item) =>
        Array.isArray(item.recurrence) &&
        item.recurrence.length > 0 &&
        typeof item.id === "string" &&
        item.id.length > 0,
    )
    .map((item) => item.id as string);
}

export async function resolveLinkedRecurringMasterIds(params: {
  accessToken: string;
  calendarId: string;
  seedMasterId: string;
  seedMasterRaw: Record<string, unknown>;
}): Promise<string[]> {
  const splitGroupId = resolveGoogleSplitGroupId(
    params.seedMasterRaw,
    params.seedMasterId,
  );
  const linked = await listGoogleCalendarRecurringMasterIdsBySplitGroup({
    accessToken: params.accessToken,
    calendarId: params.calendarId,
    splitGroupId,
  });

  const unique = new Set<string>([params.seedMasterId, ...linked]);
  return Array.from(unique);
}
