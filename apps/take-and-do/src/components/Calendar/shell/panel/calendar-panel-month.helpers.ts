export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function mondayBefore(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isoWeekNumber(anchor: Date) {
  const date = new Date(
    Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function monthGrid(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = mondayBefore(first);
  const cells: { date: Date; inMonth: boolean }[] = [];
  const cursor = new Date(gridStart);

  for (let index = 0; index < 42; index++) {
    cells.push({
      date: new Date(cursor),
      inMonth: cursor.getMonth() === month,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const rows: (typeof cells)[] = [];
  for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
    rows.push(cells.slice(rowIndex * 7, rowIndex * 7 + 7));
  }
  return rows;
}
