export function taskBelongsToScheduleRange(
  scheduleDate: Date | string | null | undefined,
  from: Date,
  to: Date,
): boolean {
  if (scheduleDate == null) return false;
  const time =
    scheduleDate instanceof Date
      ? scheduleDate.getTime()
      : Date.parse(scheduleDate);
  if (Number.isNaN(time)) return false;
  return time >= from.getTime() && time < to.getTime();
}
