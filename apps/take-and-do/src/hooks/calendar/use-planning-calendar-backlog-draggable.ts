import { Draggable } from "@fullcalendar/interaction";
import type { RefObject } from "react";
import { useEffect } from "react";

import type { CalendarBacklogEvent } from "@/types/calendar.types";

export function usePlanningCalendarBacklogDraggable(
  backlogContainerRef: RefObject<HTMLDivElement | null>,
  backlog: CalendarBacklogEvent[],
): void {
  useEffect(() => {
    const el = backlogContainerRef.current;
    if (!el) return;

    const findBacklogItem = (id: string | null) =>
      id ? (backlog.find((b) => b.id === id) ?? null) : null;

    const draggable = new Draggable(el, {
      itemSelector:
        ".calendar-backlog-draggable, .calendar-panel-task-draggable",
      eventData: (dragEl) => {
        const taskBoardId = dragEl.getAttribute("data-calendar-task-board-id");
        const taskId = dragEl.getAttribute("data-calendar-task-id");
        if (taskBoardId && taskId) {
          const title =
            dragEl.getAttribute("data-calendar-task-title")?.trim() || "Task";
          const rawMin = dragEl.getAttribute(
            "data-calendar-task-duration-minutes",
          );
          const parsed = rawMin ? Number(rawMin) : NaN;
          const minutes =
            Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 60;
          const snapshot =
            dragEl
              .getAttribute("data-calendar-task-summary-snapshot")
              ?.trim() || title;
          return {
            title,
            duration: { minutes },
            extendedProps: {
              kind: "task",
              taskBoardId,
              taskId,
              taskSummarySnapshot: snapshot,
            },
          };
        }
        const id = dragEl.getAttribute("data-backlog-id");
        const item = findBacklogItem(id);
        if (!item) {
          return { title: "Event", duration: { minutes: 60 } };
        }
        return {
          title: item.title,
          duration: { minutes: item.durationMinutes },
          extendedProps: {
            kind: item.type,
            taskScope: item.taskScope,
          },
        };
      },
    });

    return () => draggable.destroy();
  }, [backlogContainerRef, backlog]);
}
