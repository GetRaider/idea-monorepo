"use client";

import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  Draggable,
  type EventReceiveArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type {
  CalendarBacklogItem,
  CalendarEventKind,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

import {
  fcEventRangeToScheduledPatch,
  kindLabel,
  scheduledToEventInput,
} from "./calendar-event-mapper";
import "./calendar-theme.css";

interface PlanningCalendarProps {
  events: CalendarScheduledEvent[];
  backlog: CalendarBacklogItem[];
  backlogContainerRef: React.RefObject<HTMLDivElement | null>;
  onSelectRange: (start: Date, end: Date, allDay: boolean) => void;
  onEventClick: (event: CalendarScheduledEvent) => void;
  onEventReceive: (event: CalendarScheduledEvent) => void;
  onEventTimesUpdated: (
    id: string,
    patch: Pick<CalendarScheduledEvent, "start" | "end" | "allDay">,
  ) => void;
}

function isEventKind(value: unknown): value is CalendarEventKind {
  return value === "time_block" || value === "mutual" || value === "task_event";
}

export function PlanningCalendar({
  events,
  backlog,
  backlogContainerRef,
  onSelectRange,
  onEventClick,
  onEventReceive,
  onEventTimesUpdated,
}: PlanningCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const fcEvents: EventInput[] = useMemo(
    () => events.map(scheduledToEventInput),
    [events],
  );

  const findBacklogItem = useCallback(
    (id: string | null) =>
      id ? (backlog.find((b) => b.id === id) ?? null) : null,
    [backlog],
  );

  useEffect(() => {
    const el = backlogContainerRef.current;
    if (!el) return;

    const draggable = new Draggable(el, {
      itemSelector: ".calendar-backlog-draggable",
      eventData: (dragEl) => {
        const id = dragEl.getAttribute("data-backlog-id");
        const item = findBacklogItem(id);
        if (!item) {
          return { title: "Event", duration: { minutes: 60 } };
        }
        return {
          title: item.title,
          duration: { minutes: item.defaultDurationMinutes },
          extendedProps: {
            kind: item.kind,
            taskScope: item.taskScope,
            attendeesNote: item.attendeesNote,
            linkedTaskSummary: item.linkedTaskSummary,
          },
        };
      },
    });

    return () => draggable.destroy();
  }, [backlogContainerRef, findBacklogItem, backlog]);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const id = arg.event.id;
      const found = events.find((e) => e.id === id);
      if (found) onEventClick(found);
    },
    [events, onEventClick],
  );

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      const start = arg.start;
      const end = arg.end;
      if (!start || !end) return;
      onSelectRange(start, end, arg.allDay);
      arg.view.calendar.unselect();
    },
    [onSelectRange],
  );

  const handleReceive = useCallback(
    (info: EventReceiveArg) => {
      const ev = info.event;
      const start = ev.start;
      const end = ev.end;
      if (!start || !end) {
        ev.remove();
        return;
      }
      const rawKind = ev.extendedProps.kind;
      const kind: CalendarEventKind = isEventKind(rawKind)
        ? rawKind
        : "time_block";
      const taskScope = ev.extendedProps.taskScope;
      const attendeesNote = ev.extendedProps.attendeesNote;
      const linkedTaskSummary = ev.extendedProps.linkedTaskSummary;

      const scheduled: CalendarScheduledEvent = {
        id: crypto.randomUUID(),
        kind,
        title: ev.title || "Untitled",
        start: start.toISOString(),
        end: end.toISOString(),
        allDay: ev.allDay,
        ...(Array.isArray(taskScope) ? { taskScope } : {}),
        ...(typeof attendeesNote === "string" ? { attendeesNote } : {}),
        ...(typeof linkedTaskSummary === "string" ? { linkedTaskSummary } : {}),
      };
      ev.remove();
      onEventReceive(scheduled);
    },
    [onEventReceive],
  );

  const handleDrop = useCallback(
    (info: EventDropArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch);
    },
    [onEventTimesUpdated],
  );

  const handleResize = useCallback(
    (info: EventResizeDoneArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch);
    },
    [onEventTimesUpdated],
  );

  return (
    <div className="take-and-do-calendar min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-background-primary/40">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        initialView="timeGridWeek"
        editable
        selectable
        selectMirror
        droppable
        nowIndicator
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        scrollTime="08:00:00"
        height="100%"
        events={fcEvents}
        eventClick={handleEventClick}
        select={handleSelect}
        eventReceive={handleReceive}
        eventDrop={handleDrop}
        eventResize={handleResize}
        eventContent={(arg) => (
          <div className="fc-event-main-frame px-0.5 py-0.5">
            <div className="text-[9px] font-semibold uppercase leading-tight opacity-90">
              {kindLabel(
                isEventKind(arg.event.extendedProps.kind)
                  ? arg.event.extendedProps.kind
                  : "time_block",
              )}
            </div>
            <div className="text-xs font-medium leading-snug">
              {arg.event.title}
            </div>
          </div>
        )}
      />
    </div>
  );
}
