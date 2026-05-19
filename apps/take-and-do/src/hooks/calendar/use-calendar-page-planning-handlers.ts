"use client";

import type { RefObject } from "react";
import { useCallback } from "react";
import { toast } from "sonner";

import type { CalendarEventPatchBody } from "@/db/dtos/calendar-events.dto";
import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import {
  calendarEventUsesApiStorage,
  userCalendarEventToCreateBody,
  userCalendarEventToPatchBody,
} from "@/helpers/calendar-grid-server.helper";
import { selectEndToInclusiveEnd } from "@/helpers/calendar-selection";
import {
  createConnectedGoogleCalendarEvent,
  deleteConnectedGoogleCalendarEvent,
} from "@/helpers/calendar/google-calendar-sync-actions";
import {
  getEffectiveGoogleRecurrence,
  needsGoogleCalendarRecurrenceScope,
} from "@/helpers/calendar/google-calendar-recurrence.helper";
import { clientServices } from "@/services";
import type {
  CalendarCreatePrefill,
  CalendarEvent,
  CalendarEventType,
  CalendarPersistedState,
  CalendarRsvpStatus,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

import type {
  CalendarOpenFullEditorContext,
  CalendarQuickMenuPayload,
  PlanningCalendarHandle,
} from "@/components/Calendar";

export type GoogleScopePrompt =
  | { kind: "editor"; event: CalendarEvent }
  | {
      kind: "quick";
      id: string;
      patch: Partial<
        Omit<CalendarEvent, "id" | "type" | "taskBoardId" | "taskId" | "color">
      > & { color?: string | null };
      merged: CalendarEvent;
    };

export type CalendarPagePlanningHandlersDeps = {
  planningCalendarRef: RefObject<PlanningCalendarHandle | null>;
  state: CalendarPersistedState | null;
  isGuest: boolean;
  bumpServerCalendar: () => void;
  replaceScheduled: (event: CalendarEvent) => void;
  replaceScheduledForGoogleScope: (
    event: CalendarEvent,
    scope: GoogleCalendarRecurrenceScope,
  ) => void;
  patchScheduled: (id: string, patch: Partial<CalendarEvent>) => void;
  patchScheduledForGoogleScope: (
    anchorId: string,
    patch: Partial<CalendarEvent>,
    scope: GoogleCalendarRecurrenceScope,
  ) => void;
  addScheduled: (event: CalendarEvent) => void;
  removeScheduled: (id: string) => void;
  removeGoogleSeriesByMasterId: (masterId: string) => void;
  updateTask: (
    taskId: string,
    patch: { scheduleDate: Date },
  ) => Promise<unknown>;
  editorMode: "create" | "edit";
  setEditorMode: (m: "create" | "edit") => void;
  setEditorEvent: (e: CalendarEvent | null) => void;
  setCreateRange: (
    r: { start: Date; end: Date; allDay: boolean } | null,
  ) => void;
  setCreatePrefill: (p: CalendarCreatePrefill | null) => void;
  setEditorOpen: (o: boolean) => void;
  setQuickMenu: (
    u:
      | CalendarQuickMenuPayload
      | null
      | ((
          c: CalendarQuickMenuPayload | null,
        ) => CalendarQuickMenuPayload | null),
  ) => void;
  setDraftQuickKind: (k: CalendarEventType) => void;
  googleScopePrompt: GoogleScopePrompt | null;
  setGoogleScopePrompt: (p: GoogleScopePrompt | null) => void;
  setGoogleDeletePrompt: (e: CalendarEvent | null) => void;
  googleDeletePrompt: CalendarEvent | null;
  syncGoogleIfEnabled: (opts: { show: boolean }) => Promise<void>;
  pushGoogleThenSync: (
    event: CalendarEvent,
    scope?: GoogleCalendarRecurrenceScope,
  ) => void | Promise<void>;
  showGoogleCalendar: boolean;
};

export function useCalendarPagePlanningHandlers(
  deps: CalendarPagePlanningHandlersDeps,
) {
  const openFullCreateDialog = useCallback(() => {
    deps.setQuickMenu((current) => {
      if (current?.mode === "draft") {
        deps.planningCalendarRef.current?.clearSelection();
      }
      return null;
    });
    deps.setCreatePrefill(null);
    deps.setEditorMode("create");
    deps.setEditorEvent(null);
    deps.setCreateRange(null);
    deps.setEditorOpen(true);
  }, [deps]);

  const handleCloseQuickMenu = useCallback(() => {
    deps.setQuickMenu((current) => {
      if (current?.mode === "draft") {
        deps.planningCalendarRef.current?.clearSelection();
      }
      return null;
    });
  }, [deps]);

  const handleSelectRange = useCallback(
    (
      start: Date,
      end: Date,
      allDay: boolean,
      anchor: { clientX: number; clientY: number },
      anchorRect?: DOMRect,
    ) => {
      const inclusiveEnd = selectEndToInclusiveEnd(end, allDay);
      deps.setDraftQuickKind("timeBlock");
      deps.setQuickMenu({
        mode: "draft",
        start,
        end: inclusiveEnd,
        fcSelectionEnd: end,
        allDay,
        anchor,
        anchorRect,
      });
    },
    [deps],
  );

  const handlePlanningEventClick = useCallback(
    (
      event: CalendarEvent,
      anchor: { clientX: number; clientY: number },
      anchorRect?: DOMRect,
    ) => {
      deps.setQuickMenu({ mode: "existing", event, anchor, anchorRect });
    },
    [deps],
  );

  const handleOpenFullEditorFromQuick = useCallback(
    (ctx: CalendarOpenFullEditorContext) => {
      if (ctx.mode === "existing" && ctx.event) {
        deps.replaceScheduled(ctx.event);
        deps.setEditorMode("edit");
        deps.setEditorEvent(ctx.event);
        deps.setCreateRange(null);
        deps.setCreatePrefill(null);
        deps.setEditorOpen(true);
        return;
      }
      if (ctx.mode === "draft" && ctx.range) {
        deps.setCreatePrefill({
          title: ctx.quickFields.title.trim() || undefined,
          description: ctx.quickFields.description.trim() || undefined,
          type: ctx.quickFields.type,
          color: ctx.quickFields.color,
          ...(ctx.quickFields.taskScope?.length
            ? { taskScope: ctx.quickFields.taskScope }
            : {}),
          ...(ctx.quickFields.saveToGoogle ? { saveToGoogle: true } : {}),
        });
        deps.setEditorMode("create");
        deps.setEditorEvent(null);
        deps.setCreateRange(ctx.range);
        deps.setEditorOpen(true);
      }
    },
    [deps],
  );

  const handleCreateDraftFromQuick = useCallback(
    (event: CalendarEvent, opts?: { saveToGoogle?: boolean }) => {
      if (opts?.saveToGoogle && event.type === "common") {
        void (async () => {
          const created = await createConnectedGoogleCalendarEvent(event);
          if (created) {
            deps.addScheduled(created);
            await deps.syncGoogleIfEnabled({ show: deps.showGoogleCalendar });
          }
        })();
        return;
      }
      if (
        !deps.isGuest &&
        (event.type === "common" || event.type === "timeBlock")
      ) {
        void (async () => {
          const created = await clientServices.calendarEvents.create(
            userCalendarEventToCreateBody(event),
          );
          if (!created) toast.error("Could not create calendar event");
          else deps.bumpServerCalendar();
        })();
        return;
      }
      deps.addScheduled(event);
    },
    [deps],
  );

  const handleSaveEvent = useCallback(
    (event: CalendarEvent, opts?: { saveToGoogle?: boolean }) => {
      if (deps.editorMode === "create") {
        if (opts?.saveToGoogle && event.type === "common") {
          void (async () => {
            const created = await createConnectedGoogleCalendarEvent(event);
            if (created) {
              deps.addScheduled(created);
              await deps.syncGoogleIfEnabled({ show: deps.showGoogleCalendar });
            }
          })();
          return;
        }
        if (
          !deps.isGuest &&
          (event.type === "common" || event.type === "timeBlock")
        ) {
          void (async () => {
            const created = await clientServices.calendarEvents.create(
              userCalendarEventToCreateBody(event),
            );
            if (!created) toast.error("Could not create calendar event");
            else deps.bumpServerCalendar();
          })();
          return;
        }
        deps.addScheduled(event);
        return;
      }
      if (needsGoogleCalendarRecurrenceScope(event)) {
        deps.setGoogleScopePrompt({ kind: "editor", event });
        return;
      }
      if (
        !deps.isGuest &&
        (event.type === "common" || event.type === "timeBlock") &&
        calendarEventUsesApiStorage(event, false)
      ) {
        void (async () => {
          const updated = await clientServices.calendarEvents.update(
            event.id,
            userCalendarEventToPatchBody(event),
          );
          if (!updated) {
            toast.error("Could not save calendar event");
            return;
          }
          deps.replaceScheduled(updated);
          deps.bumpServerCalendar();
        })();
        return;
      }
      deps.replaceScheduled(event);
      void deps.pushGoogleThenSync(event);
    },
    [deps],
  );

  const applyGoogleScopeChoice = useCallback(
    (scope: GoogleCalendarRecurrenceScope) => {
      const prompt = deps.googleScopePrompt;
      deps.setGoogleScopePrompt(null);
      if (!prompt) return;

      const patchIsColorOnly =
        prompt.kind === "quick" &&
        Object.keys(prompt.patch).every((key) => key === "color");

      if (prompt.kind === "editor") {
        deps.replaceScheduledForGoogleScope(prompt.event, scope);
        void deps.pushGoogleThenSync(prompt.event, scope);
        deps.setEditorOpen(false);
        deps.setCreateRange(null);
        deps.setCreatePrefill(null);
        return;
      }
      if (!deps.isGuest && calendarEventUsesApiStorage(prompt.merged, false)) {
        void (async () => {
          const updated = await clientServices.calendarEvents.update(
            prompt.id,
            prompt.patch as CalendarEventPatchBody,
          );
          if (!updated) {
            toast.error("Could not update calendar event");
            return;
          }
          deps.patchScheduledForGoogleScope(
            prompt.id,
            prompt.patch as Partial<CalendarEvent>,
            scope,
          );
          deps.bumpServerCalendar();
        })();
        return;
      }
      deps.patchScheduledForGoogleScope(
        prompt.id,
        prompt.patch as Partial<CalendarEvent>,
        scope,
      );
      if (!patchIsColorOnly) {
        void deps.pushGoogleThenSync(prompt.merged, scope);
      }
    },
    [deps],
  );

  const applyGoogleDeleteScopeChoice = useCallback(
    (scope: GoogleCalendarRecurrenceScope) => {
      const ev = deps.googleDeletePrompt;
      deps.setGoogleDeletePrompt(null);
      if (!ev) return;
      if (
        ev.type !== "common" ||
        !ev.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)
      )
        return;
      const gr = getEffectiveGoogleRecurrence(ev);

      void (async () => {
        const ok = await deleteConnectedGoogleCalendarEvent({
          id: ev.id,
          recurrenceScope: scope,
          start: ev.start,
          allDay: ev.allDay,
          ...(gr ? { googleRecurrence: gr } : {}),
        });
        if (!ok) return;
        if (scope === "instance") {
          deps.removeScheduled(ev.id);
        } else if (scope === "series" && gr?.recurringEventId) {
          deps.removeGoogleSeriesByMasterId(gr.recurringEventId);
        } else {
          deps.removeScheduled(ev.id);
        }
        await deps.syncGoogleIfEnabled({ show: deps.showGoogleCalendar });
      })();
    },
    [deps],
  );

  const handleDeleteGoogleAware = useCallback(
    (event: CalendarEvent) => {
      if (
        event.type === "common" &&
        event.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)
      ) {
        deps.setGoogleDeletePrompt(event);
        return;
      }
      if (!deps.isGuest && calendarEventUsesApiStorage(event, false)) {
        void (async () => {
          const ok = await clientServices.calendarEvents.remove(event.id);
          if (!ok) {
            toast.error("Could not delete calendar event");
            return;
          }
          deps.removeScheduled(event.id);
          deps.bumpServerCalendar();
        })();
        return;
      }
      deps.removeScheduled(event.id);
    },
    [deps],
  );

  const handleEventTimesUpdated = useCallback(
    (
      id: string,
      patch: Pick<CalendarEvent, "start" | "end" | "allDay">,
      revert: () => void,
    ) => {
      if (!deps.state) {
        revert();
        return;
      }
      const ev = deps.state.events.find((e) => e.id === id);
      if (!ev) {
        revert();
        return;
      }
      const merged = { ...ev, ...patch } as CalendarEvent;
      if (needsGoogleCalendarRecurrenceScope(merged)) {
        revert();
        deps.setGoogleScopePrompt({ kind: "quick", id, patch, merged });
        return;
      }
      if (merged.type === "task") {
        void deps.updateTask(merged.taskId, {
          scheduleDate: new Date(merged.start),
        });
        if (deps.isGuest) {
          deps.patchScheduled(id, patch as Partial<CalendarEvent>);
          void deps.pushGoogleThenSync(merged);
        } else {
          deps.bumpServerCalendar();
        }
        return;
      }
      if (!deps.isGuest && calendarEventUsesApiStorage(merged, false)) {
        void (async () => {
          const updated = await clientServices.calendarEvents.update(
            id,
            patch as CalendarEventPatchBody,
          );
          if (!updated) {
            toast.error("Could not update calendar event");
            revert();
            return;
          }
          deps.patchScheduled(id, patch as Partial<CalendarEvent>);
          deps.bumpServerCalendar();
        })();
        void deps.pushGoogleThenSync(merged);
        return;
      }
      deps.patchScheduled(id, patch as Partial<CalendarEvent>);
      void deps.pushGoogleThenSync(merged);
    },
    [deps],
  );

  const persistExistingAndMaybePush = useCallback(
    (
      id: string,
      patch: Partial<
        Omit<CalendarEvent, "id" | "type" | "taskBoardId" | "taskId" | "color">
      > & { color?: string | null },
    ) => {
      if (!deps.state) return;
      const ev = deps.state.events.find((e) => e.id === id);
      if (!ev) return;
      const merged = { ...ev, ...patch } as CalendarEvent;
      if (needsGoogleCalendarRecurrenceScope(merged)) {
        deps.setGoogleScopePrompt({ kind: "quick", id, patch, merged });
        return;
      }
      if (
        merged.type === "task" &&
        ("start" in patch || "end" in patch || "allDay" in patch)
      ) {
        void deps.updateTask(merged.taskId, {
          scheduleDate: new Date(merged.start),
        });
        if (deps.isGuest) {
          deps.patchScheduled(id, patch as Partial<CalendarEvent>);
          void deps.pushGoogleThenSync(merged);
        } else {
          deps.bumpServerCalendar();
        }
        return;
      }
      if (!deps.isGuest && calendarEventUsesApiStorage(merged, false)) {
        void (async () => {
          const updated = await clientServices.calendarEvents.update(
            id,
            patch as CalendarEventPatchBody,
          );
          if (!updated) {
            toast.error("Could not update calendar event");
            return;
          }
          deps.patchScheduled(id, patch as Partial<CalendarEvent>);
          deps.bumpServerCalendar();
        })();
        void deps.pushGoogleThenSync(merged);
        return;
      }
      deps.patchScheduled(id, patch as Partial<CalendarEvent>);
      void deps.pushGoogleThenSync(merged);
    },
    [deps],
  );

  const handleDuplicateEvent = useCallback(
    (event: CalendarEvent) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = end.getTime() - start.getTime();
      const newStart = new Date(end.getTime());
      const newEnd = new Date(newStart.getTime() + duration);
      const dup = {
        ...event,
        id: crypto.randomUUID(),
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        ...(event.type === "common"
          ? {
              rsvpStatus: undefined,
              rsvpDeclineReason: undefined,
              googleRecurrence: undefined,
            }
          : {}),
      } as CalendarEvent;
      if (
        !deps.isGuest &&
        (event.type === "common" || event.type === "timeBlock")
      ) {
        void (async () => {
          if (dup.type !== "common" && dup.type !== "timeBlock") return;
          const created = await clientServices.calendarEvents.create(
            userCalendarEventToCreateBody(dup),
          );
          if (!created) toast.error("Could not duplicate event");
          else deps.bumpServerCalendar();
        })();
        return;
      }
      deps.addScheduled(dup);
    },
    [deps],
  );

  const handleRsvpChange = useCallback(
    (id: string, rsvp: CalendarRsvpStatus, declineReason?: string) => {
      const rsvpPatch = {
        rsvpStatus: rsvp,
        rsvpDeclineReason:
          rsvp === "no" ? declineReason?.trim() || undefined : undefined,
      };
      if (!deps.isGuest && deps.state) {
        const ev = deps.state.events.find((e) => e.id === id);
        if (ev && calendarEventUsesApiStorage(ev, false)) {
          void (async () => {
            const updated = await clientServices.calendarEvents.update(
              id,
              rsvpPatch,
            );
            if (!updated) toast.error("Could not update RSVP");
            else deps.bumpServerCalendar();
          })();
          return;
        }
      }
      deps.patchScheduled(id, rsvpPatch);
    },
    [deps],
  );

  const handlePlanningEventReceive = useCallback(
    (event: CalendarEvent) => {
      if (event.type === "task") {
        void deps.updateTask(event.taskId, {
          scheduleDate: new Date(event.start),
        });
        if (deps.isGuest) {
          deps.addScheduled(event);
        } else {
          deps.bumpServerCalendar();
        }
        return;
      }
      if (
        !deps.isGuest &&
        (event.type === "common" || event.type === "timeBlock")
      ) {
        void (async () => {
          const created = await clientServices.calendarEvents.create(
            userCalendarEventToCreateBody(event),
          );
          if (!created) toast.error("Could not place calendar event");
          else deps.bumpServerCalendar();
        })();
        return;
      }
      deps.addScheduled(event);
    },
    [deps],
  );

  return {
    openFullCreateDialog,
    handleCloseQuickMenu,
    handleSelectRange,
    handlePlanningEventClick,
    handleOpenFullEditorFromQuick,
    handleCreateDraftFromQuick,
    handleSaveEvent,
    applyGoogleScopeChoice,
    applyGoogleDeleteScopeChoice,
    handleDeleteGoogleAware,
    handleEventTimesUpdated,
    persistExistingAndMaybePush,
    handleDuplicateEvent,
    handleRsvpChange,
    handlePlanningEventReceive,
  };
}
