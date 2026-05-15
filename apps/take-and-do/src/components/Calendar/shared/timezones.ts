import type { DropdownOption } from "@/components/Dropdown";

const FALLBACK_TIMEZONES: string[] = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Warsaw",
  "Europe/Kyiv",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
];

function supportedTimeZones(): string[] {
  const intlAny = Intl as unknown as {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const values = intlAny.supportedValuesOf?.("timeZone");
  if (Array.isArray(values) && values.length > 0) return values;
  return FALLBACK_TIMEZONES;
}

export function timeZoneOptions(): DropdownOption<string>[] {
  const zones = supportedTimeZones();
  // Keeping "Local" explicit helps users clear the field.
  return [
    { value: "", label: "Local" },
    ...zones.map((tz) => ({ value: tz, label: tz })),
  ];
}
