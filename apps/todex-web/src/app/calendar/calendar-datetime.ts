export function toInputValue(iso: string, allDay: boolean): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const datePart = `${date.getFullYear()}-${month}-${day}`;
  if (allDay) return datePart;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart}T${hours}:${minutes}`;
}

export function fromInputValue(value: string, allDay: boolean): string | null {
  if (!value) return null;
  if (allDay) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day).toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function withAllDay(startIso: string, endIso: string, allDay: boolean) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (allDay) {
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end <= start) end.setDate(start.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (start.getHours() === 0 && start.getMinutes() === 0) {
    start.setHours(9, 0, 0, 0);
    end.setTime(start.getTime());
    end.setHours(10, 0, 0, 0);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
