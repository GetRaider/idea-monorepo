import { TIMER_MAX_PLANNED_SECONDS } from "../shared/records.types";

export const DURATION_PRESET_MINUTES = [10, 30, 60] as const;

export function isPresetDurationMinutes(minutes: number): boolean {
  return (DURATION_PRESET_MINUTES as readonly number[]).includes(minutes);
}

export function isPresetDurationSeconds(totalSeconds: number): boolean {
  return totalSeconds % 60 === 0 && isPresetDurationMinutes(totalSeconds / 60);
}

export function formatDurationChipLabel(minutes: number): string {
  if (minutes === 60) {
    return "1h";
  }

  return `${minutes}m`;
}

export function splitDurationHms(totalSeconds: number): DurationHms {
  const clampedSeconds = Math.max(0, Math.min(TIMER_MAX_PLANNED_SECONDS, Math.floor(totalSeconds)));
  return {
    hours: Math.floor(clampedSeconds / 3600),
    minutes: Math.floor((clampedSeconds % 3600) / 60),
    seconds: clampedSeconds % 60,
  };
}

export function combineDurationHms(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDurationHms(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitDurationHms(totalSeconds);
  return `${padDurationUnit(hours)}:${padDurationUnit(minutes)}:${padDurationUnit(seconds)}`;
}

export function padDurationUnit(value: number): string {
  return String(value).padStart(2, "0");
}

export interface DurationHms {
  hours: number;
  minutes: number;
  seconds: number;
}
