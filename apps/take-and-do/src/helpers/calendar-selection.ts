/** Convert FullCalendar selection end (exclusive) to inclusive end for editors. */
export function selectEndToInclusiveEnd(
  endExclusive: Date,
  allDay: boolean,
): Date {
  if (allDay) {
    const d = new Date(endExclusive);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return new Date(endExclusive.getTime() - 1);
}
