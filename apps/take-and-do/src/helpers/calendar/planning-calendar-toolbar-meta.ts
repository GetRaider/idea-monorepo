import type { DatesSetArg } from "@fullcalendar/core";

export type PlanningCalendarToolbarMeta = {
  headline: string;
  rangeLabel: string;
  badgeMonth: string;
  badgeDay: string;
};

export function planningCalendarToolbarMetaFromDatesSet(
  arg: DatesSetArg,
): PlanningCalendarToolbarMeta {
  const rangeStart = arg.start;
  const rangeEndExclusive = arg.end;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inView = today >= rangeStart && today < rangeEndExclusive;
  const badgeBase = inView ? today : rangeStart;
  const monthNum = String(badgeBase.getMonth() + 1);
  const monthLong = badgeBase.toLocaleDateString(undefined, {
    month: "long",
  });
  const yearNum = badgeBase.getFullYear();
  return {
    headline: `${monthLong} (${monthNum}) ${yearNum}`,
    rangeLabel: arg.view.title,
    badgeMonth: badgeBase
      .toLocaleDateString(undefined, { month: "short" })
      .toUpperCase(),
    badgeDay: String(badgeBase.getDate()),
  };
}
