"use client";

import type { EventContentArg } from "@fullcalendar/core";

import { cn } from "@/lib/styles/utils";
import {
  extendedPropsToKind,
  kindLabel,
} from "@/helpers/calendar/calendar-event-mapper";
import {
  TAD_END_MS_ATTR,
  TAD_EVENT_ID_ATTR,
  TAD_START_MS_ATTR,
  TAD_WALL_START_ATTR,
  wallClockStartKeyFromDate,
} from "@/helpers/calendar/planning-calendar-overlap-layout";
import {
  formatEventTimeSubtitle,
  SHORT_TIMED_ONE_LINE_MS,
} from "@/helpers/calendar/planning-calendar-time-format";
import type { CalendarEventType } from "@/types/calendar.types";

import type { PlanningTimeGridSlotMinutes } from "./Toolbar";
import { CalendarKindIcon, calendarKindIconSizePx } from "../shared/KindIcon";

interface EventTitleBlockProps {
  tip: string;
  iconKind: CalendarEventType;
  iconPx: number;
  compactTimed: boolean;
  primary: string;
  secondary: string | null;
  extra: string | null;
  padY: "tight" | "normal";
  timeBesideTitle: boolean;
  overlapLayoutDomProps: Record<string, string>;
}

export interface PlanningCalendarEventContentProps extends EventContentArg {
  slotTime24h: boolean;
  draftSelectionKind: CalendarEventType | null;
  gridSlotMinutes: PlanningTimeGridSlotMinutes;
}

export function PlanningCalendarEventContent({
  isMirror,
  isDragging,
  isResizing,
  event: fcEvent,
  slotTime24h,
  draftSelectionKind,
  gridSlotMinutes,
}: PlanningCalendarEventContentProps) {
  const isExistingEventMirror = isMirror && (isDragging || isResizing);
  const draftMirrorKind: CalendarEventType | null =
    isMirror && !isExistingEventMirror
      ? (draftSelectionKind ?? "timeBlock")
      : null;

  const kind = isExistingEventMirror
    ? extendedPropsToKind(fcEvent.extendedProps.kind)
    : draftMirrorKind
      ? draftMirrorKind
      : extendedPropsToKind(fcEvent.extendedProps.kind);
  const taskSnap = fcEvent.extendedProps.taskSummarySnapshot as
    | string
    | undefined;
  const start = fcEvent.start;
  const end = fcEvent.end;
  const durMs = start && end ? end.getTime() - start.getTime() : 0;
  const compactTimed = !fcEvent.allDay && durMs > 0 && durMs <= 55 * 60 * 1000;
  const shortOneLineTimed =
    !fcEvent.allDay && durMs > 0 && durMs <= SHORT_TIMED_ONE_LINE_MS;
  const tip = draftMirrorKind
    ? `${kindLabel(draftMirrorKind)} — New event`
    : `${kindLabel(kind)} — ${fcEvent.title}`;
  const iconPx =
    isMirror && !isExistingEventMirror
      ? 10
      : calendarKindIconSizePx(durMs, !!fcEvent.allDay);

  const timeSubtitle =
    !fcEvent.allDay && start && end
      ? formatEventTimeSubtitle(start, end, slotTime24h, durMs)
      : "";

  const timeBesideTitle = Boolean(timeSubtitle) && shortOneLineTimed;

  const coarseGridMicroBody =
    gridSlotMinutes === 30 &&
    !fcEvent.allDay &&
    durMs > 0 &&
    durMs <= SHORT_TIMED_ONE_LINE_MS;
  const overlapLayoutDomProps = buildOverlapLayoutDomProps(fcEvent);

  if (draftMirrorKind) {
    if (coarseGridMicroBody) {
      return (
        <CoarseGridMicroEventBody
          tip={tip}
          primary={kindLabel(draftMirrorKind)}
          secondary={timeSubtitle || null}
          overlapLayoutDomProps={overlapLayoutDomProps}
        />
      );
    }
    return (
      <EventTitleBlock
        tip={tip}
        iconKind={draftMirrorKind}
        iconPx={iconPx}
        compactTimed={compactTimed}
        primary={kindLabel(draftMirrorKind)}
        secondary={timeSubtitle || null}
        extra={null}
        padY={compactTimed ? "tight" : "normal"}
        timeBesideTitle={timeBesideTitle}
        overlapLayoutDomProps={overlapLayoutDomProps}
      />
    );
  }

  if (coarseGridMicroBody) {
    return (
      <CoarseGridMicroEventBody
        tip={tip}
        primary={fcEvent.title}
        secondary={timeSubtitle || null}
        overlapLayoutDomProps={overlapLayoutDomProps}
      />
    );
  }

  if (compactTimed) {
    return (
      <EventTitleBlock
        tip={tip}
        iconKind={kind}
        iconPx={iconPx}
        compactTimed
        primary={fcEvent.title}
        secondary={timeSubtitle || null}
        extra={null}
        padY="tight"
        timeBesideTitle={timeBesideTitle}
        overlapLayoutDomProps={overlapLayoutDomProps}
      />
    );
  }

  const titleTrim = (fcEvent.title ?? "").trim();
  const snapTrim = (taskSnap ?? "").trim();
  const extraSubtitle =
    snapTrim.length > 0 && snapTrim !== titleTrim ? snapTrim : null;

  return (
    <EventTitleBlock
      tip={tip}
      iconKind={kind}
      iconPx={iconPx}
      compactTimed={false}
      primary={fcEvent.title}
      secondary={timeSubtitle || null}
      extra={extraSubtitle}
      padY="normal"
      timeBesideTitle={timeBesideTitle}
      overlapLayoutDomProps={overlapLayoutDomProps}
    />
  );
}

function buildOverlapLayoutDomProps(
  fcEvent: PlanningCalendarEventContentProps["event"],
): Record<string, string> {
  if (fcEvent.allDay || !fcEvent.start || !fcEvent.end) return {};
  return {
    [TAD_EVENT_ID_ATTR]: fcEvent.id,
    [TAD_WALL_START_ATTR]: wallClockStartKeyFromDate(fcEvent.start),
    [TAD_START_MS_ATTR]: String(fcEvent.start.getTime()),
    [TAD_END_MS_ATTR]: String(fcEvent.end.getTime()),
  };
}

function CoarseGridMicroEventBody({
  tip,
  primary,
  secondary,
  overlapLayoutDomProps,
}: {
  tip: string;
  primary: string;
  secondary: string | null;
  overlapLayoutDomProps: Record<string, string>;
}) {
  return (
    <div
      className="fc-event-main-frame tad-planning-event-inner tad-planning-event-inner--coarse-micro min-h-0 min-w-0"
      title={tip}
      {...overlapLayoutDomProps}
    >
      <div className="flex min-h-0 min-w-0 flex-1 items-center gap-1 leading-none">
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight text-text-primary">
          {primary}
        </span>
        {secondary ? (
          <span className="shrink-0 text-[9px] font-medium tabular-nums leading-none text-zinc-400">
            {secondary}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function EventTitleBlock({
  tip,
  iconKind,
  iconPx,
  compactTimed,
  primary,
  secondary,
  extra,
  padY,
  timeBesideTitle,
  overlapLayoutDomProps,
}: EventTitleBlockProps) {
  return (
    <div
      className={cn(
        "fc-event-main-frame tad-planning-event-inner min-h-0 min-w-0",
        padY === "tight" ? "py-px" : "py-0.5",
      )}
      title={tip}
      {...overlapLayoutDomProps}
    >
      <span
        className="calendar-kind-icon-wrap flex shrink-0 items-center justify-center rounded bg-black/20 p-px"
        aria-hidden
      >
        <CalendarKindIcon
          kind={iconKind}
          size={Math.min(iconPx, compactTimed ? 10 : 11)}
          color="rgba(250,250,250,0.95)"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {timeBesideTitle && secondary ? (
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="min-w-0 truncate text-[10px] font-medium leading-tight text-text-primary">
              {primary}
            </span>
            <span className="shrink-0 text-[9px] font-normal leading-none tabular-nums text-zinc-400">
              {secondary}
            </span>
          </div>
        ) : (
          <>
            <div className="truncate text-[10px] font-medium leading-tight text-text-primary">
              {primary}
            </div>
            {secondary ? (
              <div className="truncate text-[9px] font-normal leading-tight tabular-nums text-zinc-400">
                {secondary}
              </div>
            ) : null}
          </>
        )}
        {extra ? (
          <div className="truncate text-[9px] font-normal leading-tight text-zinc-500">
            {extra}
          </div>
        ) : null}
      </div>
    </div>
  );
}
