"use client";

import type {
  DateSelectArg,
  DatesSetArg,
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
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CalendarBacklogItem,
  CalendarEventKind,
  CalendarKindVisibility,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

import { CalendarPlanningToolbar } from "./CalendarPlanningToolbar";
import {
  extendedPropsToKind,
  fcEventRangeToScheduledPatch,
  kindLabel,
  scheduledToEventInput,
} from "./calendar-event-mapper";
import "./calendar-theme.css";

const CUSTOM_VIEWS = {
  timeGridTwoDay: {
    type: "timeGrid" as const,
    duration: { days: 2 },
    buttonText: "2d",
  },
  timeGridThreeDay: {
    type: "timeGrid" as const,
    duration: { days: 3 },
    buttonText: "3d",
  },
  timeGridFourDay: {
    type: "timeGrid" as const,
    duration: { days: 4 },
    buttonText: "4d",
  },
  timeGridFiveDay: {
    type: "timeGrid" as const,
    duration: { days: 5 },
    buttonText: "5d",
  },
};

const DEFAULT_KIND_VISIBILITY: CalendarKindVisibility = {
  time_block: true,
  general: true,
  task_event: true,
};

export type PlanningCalendarHandle = {
  goToDate: (d: Date) => void;
};

interface PlanningCalendarProps {
  events: CalendarScheduledEvent[];
  backlog: CalendarBacklogItem[];
  backlogContainerRef: React.RefObject<HTMLDivElement | null>;
  visibleKinds?: CalendarKindVisibility;
  onSelectRange: (
    start: Date,
    end: Date,
    allDay: boolean,
    anchor: { clientX: number; clientY: number },
  ) => void;
  onEventClick: (
    event: CalendarScheduledEvent,
    anchor: { clientX: number; clientY: number },
  ) => void;
  onEventReceive: (event: CalendarScheduledEvent) => void;
  onEventTimesUpdated: (
    id: string,
    patch: Pick<CalendarScheduledEvent, "start" | "end" | "allDay">,
  ) => void;
}

function isEventKind(value: unknown): value is CalendarEventKind {
  return (
    value === "time_block" || value === "general" || value === "task_event"
  );
}

export const PlanningCalendar = forwardRef<
  PlanningCalendarHandle,
  PlanningCalendarProps
>(function PlanningCalendar(
  {
    events,
    backlog,
    backlogContainerRef,
    visibleKinds = DEFAULT_KIND_VISIBILITY,
    onSelectRange,
    onEventClick,
    onEventReceive,
    onEventTimesUpdated,
  },
  ref,
) {
  const fcRef = useRef<FullCalendar>(null);
  const [activeViewType, setActiveViewType] = useState("timeGridWeek");

  useImperativeHandle(ref, () => ({
    goToDate: (d: Date) => {
      fcRef.current?.getApi().gotoDate(d);
    },
  }));

  const getApi = useCallback(() => fcRef.current?.getApi() ?? null, []);

  const fcEvents: EventInput[] = useMemo(() => {
    const filtered = events.filter((e) => visibleKinds[e.kind]);
    return filtered.map(scheduledToEventInput);
  }, [events, visibleKinds]);

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
          },
        };
      },
    });

    return () => draggable.destroy();
  }, [backlogContainerRef, findBacklogItem, backlog]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setActiveViewType(arg.view.type);
  }, []);

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      const start = arg.start;
      const end = arg.end;
      if (!start || !end) return;
      const x = arg.jsEvent?.clientX ?? window.innerWidth / 2;
      const y = arg.jsEvent?.clientY ?? 140;
      onSelectRange(start, end, arg.allDay, { clientX: x, clientY: y });
      arg.view.calendar.unselect();
    },
    [onSelectRange],
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const id = info.event.id;
      const found = events.find((e) => e.id === id);
      if (!found) return;
      info.jsEvent.preventDefault();
      onEventClick(found, {
        clientX: info.jsEvent.clientX,
        clientY: info.jsEvent.clientY,
      });
    },
    [events, onEventClick],
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
        ? extendedPropsToKind(rawKind)
        : "time_block";
      const taskScope = ev.extendedProps.taskScope;
      const attendeesNote = ev.extendedProps.attendeesNote;

      const scheduled: CalendarScheduledEvent = {
        id: crypto.randomUUID(),
        kind,
        title: ev.title || "Untitled",
        start: start.toISOString(),
        end: end.toISOString(),
        allDay: ev.allDay,
        ...(Array.isArray(taskScope) ? { taskScope } : {}),
        ...(typeof attendeesNote === "string" ? { attendeesNote } : {}),
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
    <div className="take-and-do-calendar calendar-surface flex min-h-0 flex-1 flex-col overflow-hidden">
      <CalendarPlanningToolbar
        getApi={getApi}
        activeViewType={activeViewType}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <FullCalendar
          ref={fcRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          views={CUSTOM_VIEWS}
          headerToolbar={false}
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
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          select={handleSelect}
          eventReceive={handleReceive}
          eventDrop={handleDrop}
          eventResize={handleResize}
          eventContent={(arg) => {
            const kind = extendedPropsToKind(arg.event.extendedProps.kind);
            const taskSnap = arg.event.extendedProps.taskSummarySnapshot as
              | string
              | undefined;
            return (
              <div className="fc-event-main-frame px-0.5 py-0.5">
                <div className="text-[9px] font-semibold uppercase leading-tight opacity-90">
                  {kindLabel(kind)}
                </div>
                <div className="text-xs font-medium leading-snug">
                  {arg.event.title}
                </div>
                {taskSnap ? (
                  <div className="truncate text-[9px] leading-tight opacity-80">
                    {taskSnap}
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
});

PlanningCalendar.displayName = "PlanningCalendar";
