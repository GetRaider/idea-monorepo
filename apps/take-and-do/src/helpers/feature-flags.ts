function readPublicFeatureEnabled(
  raw: string | undefined,
  defaultEnabled: boolean,
): boolean {
  if (raw == null || raw === "") return defaultEnabled;
  const v = raw.trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(v)) return false;
  if (["1", "true", "yes", "on"].includes(v)) return true;
  return defaultEnabled;
}

/** Controlled by `NEXT_PUBLIC_FEATURE_CALENDAR` (unset = enabled). */
export function isCalendarFeatureEnabled(): boolean {
  return readPublicFeatureEnabled(
    process.env.NEXT_PUBLIC_FEATURE_CALENDAR,
    true,
  );
}
