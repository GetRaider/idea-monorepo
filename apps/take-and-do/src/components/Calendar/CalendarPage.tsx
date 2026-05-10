"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AppPageSubtitle,
  AppPageTitle,
  HomeMainContent,
  PageContainer,
  WelcomeSection,
} from "@/app/shell.ui";
import { PrimaryButton } from "@/components/Buttons";
import { PlusIcon } from "@/components/Icons";
import { defaultAxisTimeZones } from "@/components/Calendar/calendar-axis-time";
import { useCalendarStore } from "@/hooks/calendar/use-calendar-store";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Spinner } from "@/components/Spinner/Spinner";
import type {
  CalendarBacklogEvent,
  CalendarCreatePrefill,
  CalendarEvent,
  CalendarEventType,
  CalendarKindVisibility,
  CalendarRsvpStatus,
} from "@/types/calendar.types";

import { CalendarPanel } from "./CalendarPanel";
import { CalendarEventEditorDialog } from "./CalendarEventEditorDialog";
import {
  CalendarEventQuickMenu,
  type CalendarOpenFullEditorContext,
  type CalendarQuickMenuPayload,
} from "./CalendarEventQuickMenu";
import { CalendarTemplateEditorDialog } from "./CalendarTemplateEditorDialog";
import {
  PlanningCalendar,
  type PlanningCalendarHandle,
} from "./PlanningCalendar";

function selectEndToInclusiveEnd(endExclusive: Date, allDay: boolean): Date {
  if (allDay) {
    const d = new Date(endExclusive);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return new Date(endExclusive.getTime() - 1);
}

const DEFAULT_KIND_VISIBILITY: CalendarKindVisibility = {
  timeBlock: true,
  common: true,
  task: true,
};

const GCAL_PREFIX = "gcal:";
const SLOT_TIME_24H_KEY = "take-and-do:calendar-slot-24h";

export function CalendarPage() {
  const planningCalendarRef = useRef<PlanningCalendarHandle>(null);
  const backlogContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarScopeRef = useRef<HTMLDivElement | null>(null);
  const {
    state,
    addScheduled,
    patchScheduled,
    replaceScheduled,
    removeScheduled,
    addBacklogItem,
    removeBacklogItem,
    updateBacklogItem,
    mergeScheduledEvents,
    setAxisTimeZones,
  } = useCalendarStore();

  const [, setCurrentPage] = useState("calendar");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | null>(null);
  const [createRange, setCreateRange] = useState<{
    start: Date;
    end: Date;
    allDay: boolean;
  } | null>(null);
  const [createPrefill, setCreatePrefill] =
    useState<CalendarCreatePrefill | null>(null);

  const [quickMenu, setQuickMenu] = useState<CalendarQuickMenuPayload | null>(
    null,
  );
  const [draftSelectionVersion, setDraftSelectionVersion] = useState(0);
  const [draftQuickKind, setDraftQuickKind] =
    useState<CalendarEventType>("timeBlock");

  const [slotTime24h, setSlotTime24h] = useState(false);

  useEffect(() => {
    try {
      setSlotTime24h(window.localStorage.getItem(SLOT_TIME_24H_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const setSlotTime24hPersist = useCallback((next: boolean) => {
    setSlotTime24h(next);
    try {
      window.localStorage.setItem(SLOT_TIME_24H_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const draftSelectionHighlight = useMemo(() => {
    if (!quickMenu || quickMenu.mode !== "draft") return null;
    return {
      start: quickMenu.start,
      endExclusive: quickMenu.fcSelectionEnd,
      allDay: quickMenu.allDay,
    };
  }, [quickMenu]);

  const bumpDraftSelection = useCallback(() => {
    setDraftSelectionVersion((v) => v + 1);
  }, []);

  const handleCloseQuickMenu = useCallback(() => {
    setQuickMenu((current) => {
      if (current?.mode === "draft") {
        planningCalendarRef.current?.clearSelection();
      }
      return null;
    });
  }, []);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState<"create" | "edit">("create");
  const [templateInitial, setTemplateInitial] =
    useState<CalendarBacklogEvent | null>(null);

  const [kindVisibility, setKindVisibility] = useState<CalendarKindVisibility>(
    DEFAULT_KIND_VISIBILITY,
  );
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(true);
  const [googleCalendarLabel, setGoogleCalendarLabel] = useState<string | null>(
    null,
  );
  const isSyncingRef = useRef(false);
  const didInitialGoogleSyncRef = useRef(false);

  const syncGoogleIfEnabled = useCallback(
    async (opts?: { show?: boolean }) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        const statusRes = await fetch("/api/integrations/google-calendar", {
          method: "GET",
        });
        if (!statusRes.ok) return;
        const status = (await statusRes.json()) as {
          connected: boolean;
          enabled: boolean;
          email: string | null;
        };

        setGoogleCalendarLabel(status.email);

        if (!(opts?.show ?? showGoogleCalendar)) return;
        if (!status.connected) return;
        if (!status.enabled) return;

        const syncRes = await fetch("/api/integrations/google-calendar/sync", {
          method: "POST",
        });
        if (!syncRes.ok) return;
        const data = (await syncRes.json()) as {
          imported: CalendarEvent[];
        };
        mergeScheduledEvents(data.imported);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [mergeScheduledEvents, showGoogleCalendar],
  );

  useEffect(() => {
    if (!state) return;
    if (didInitialGoogleSyncRef.current) return;
    didInitialGoogleSyncRef.current = true;
    void syncGoogleIfEnabled({ show: showGoogleCalendar });
  }, [state, showGoogleCalendar, syncGoogleIfEnabled]);

  const openFullCreateDialog = useCallback(() => {
    setQuickMenu((current) => {
      if (current?.mode === "draft") {
        planningCalendarRef.current?.clearSelection();
      }
      return null;
    });
    setCreatePrefill(null);
    setEditorMode("create");
    setEditorEvent(null);
    setCreateRange(null);
    setEditorOpen(true);
  }, []);

  const handleSelectRange = useCallback(
    (
      start: Date,
      end: Date,
      allDay: boolean,
      anchor: { clientX: number; clientY: number },
      anchorRect?: DOMRect,
    ) => {
      const inclusiveEnd = selectEndToInclusiveEnd(end, allDay);
      setDraftQuickKind("timeBlock");
      setQuickMenu({
        mode: "draft",
        start,
        end: inclusiveEnd,
        fcSelectionEnd: end,
        allDay,
        anchor,
        anchorRect,
      });
    },
    [],
  );

  const handlePlanningEventClick = useCallback(
    (
      event: CalendarEvent,
      anchor: { clientX: number; clientY: number },
      anchorRect?: DOMRect,
    ) => {
      setQuickMenu({ mode: "existing", event, anchor, anchorRect });
    },
    [],
  );

  const handleOpenFullEditorFromQuick = useCallback(
    (ctx: CalendarOpenFullEditorContext) => {
      if (ctx.mode === "existing" && ctx.event) {
        replaceScheduled(ctx.event);
        setEditorMode("edit");
        setEditorEvent(ctx.event);
        setCreateRange(null);
        setCreatePrefill(null);
        setEditorOpen(true);
        return;
      }
      if (ctx.mode === "draft" && ctx.range) {
        setCreatePrefill({
          title: ctx.quickFields.title.trim() || undefined,
          description: ctx.quickFields.description.trim() || undefined,
          type: ctx.quickFields.type,
        });
        setEditorMode("create");
        setEditorEvent(null);
        setCreateRange(ctx.range);
        setEditorOpen(true);
      }
    },
    [replaceScheduled],
  );

  const handleSaveEvent = useCallback(
    (event: CalendarEvent) => {
      if (editorMode === "create") {
        addScheduled(event);
        return;
      }
      replaceScheduled(event);
    },
    [addScheduled, replaceScheduled, editorMode],
  );

  const handleEventTimesUpdated = useCallback(
    (id: string, patch: Pick<CalendarEvent, "start" | "end" | "allDay">) => {
      patchScheduled(id, patch);
    },
    [patchScheduled],
  );

  const handleDuplicateEvent = useCallback(
    (event: CalendarEvent) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = end.getTime() - start.getTime();
      const newStart = new Date(end.getTime());
      const newEnd = new Date(newStart.getTime() + duration);
      addScheduled({
        ...event,
        id: crypto.randomUUID(),
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        ...(event.type === "common"
          ? { rsvpStatus: undefined, rsvpDeclineReason: undefined }
          : {}),
      });
    },
    [addScheduled],
  );

  const handleRsvpChange = useCallback(
    (id: string, rsvp: CalendarRsvpStatus, declineReason?: string) => {
      patchScheduled(id, {
        rsvpStatus: rsvp,
        rsvpDeclineReason:
          rsvp === "no" ? declineReason?.trim() || undefined : undefined,
      });
    },
    [patchScheduled],
  );

  const openNewTemplate = useCallback(() => {
    setTemplateMode("create");
    setTemplateInitial(null);
    setTemplateDialogOpen(true);
  }, []);

  const openEditTemplate = useCallback((item: CalendarBacklogEvent) => {
    setTemplateMode("edit");
    setTemplateInitial(item);
    setTemplateDialogOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(
    (item: CalendarBacklogEvent) => {
      if (templateMode === "create") {
        addBacklogItem(item);
        return;
      }
      updateBacklogItem(item.id, item);
    },
    [addBacklogItem, updateBacklogItem, templateMode],
  );

  if (!state) {
    return (
      <PageContainer>
        <Sidebar onNavigationChange={setCurrentPage} />
        <HomeMainContent withNavSidebar={false}>
          <Spinner className="h-full min-h-[240px] flex-1" />
        </HomeMainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar onNavigationChange={setCurrentPage} />
      <HomeMainContent
        withNavSidebar={false}
        className="flex min-h-0 flex-col px-6 py-6 max-[600px]:px-4 max-[600px]:py-4"
      >
        <WelcomeSection className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <AppPageTitle>Calendar</AppPageTitle>
            <AppPageSubtitle className="mt-2 max-w-[640px]">
              Plan time blocks, common events, and task windows.
            </AppPageSubtitle>
          </div>
          <PrimaryButton
            size="sm"
            className="shrink-0 font-medium"
            onClick={openFullCreateDialog}
          >
            <PlusIcon size={18} className="shrink-0 text-white" />
            Create Event
          </PrimaryButton>
        </WelcomeSection>

        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:gap-6">
          <CalendarPanel
            containerRef={backlogContainerRef}
            items={state.backlog}
            kindVisibility={kindVisibility}
            onKindVisibilityChange={setKindVisibility}
            onPickCalendarDay={(d) => planningCalendarRef.current?.goToDate(d)}
            onRequestNewTemplate={openNewTemplate}
            onEditTemplate={openEditTemplate}
            onRemoveItem={removeBacklogItem}
            showGoogleCalendar={showGoogleCalendar}
            onShowGoogleCalendarChange={(next) => {
              setShowGoogleCalendar(next);
              if (next) {
                void syncGoogleIfEnabled({ show: true });
              }
            }}
            googleCalendarLabel={googleCalendarLabel}
          />
          <div ref={calendarScopeRef} className="relative flex min-h-0 flex-1">
            <PlanningCalendar
              ref={planningCalendarRef}
              axisTimeZones={state?.axisTimeZones ?? defaultAxisTimeZones()}
              onAxisTimeZonesChange={setAxisTimeZones}
              events={
                showGoogleCalendar
                  ? state.events
                  : state.events.filter((e) => !e.id.startsWith(GCAL_PREFIX))
              }
              backlog={state.backlog}
              backlogContainerRef={backlogContainerRef}
              visibleKinds={kindVisibility}
              onSelectRange={handleSelectRange}
              onEventClick={handlePlanningEventClick}
              onEventReceive={addScheduled}
              onEventTimesUpdated={handleEventTimesUpdated}
              draftSelectionHighlight={draftSelectionHighlight}
              draftSelectionVersion={draftSelectionVersion}
              draftSelectionKind={
                quickMenu?.mode === "draft" ? draftQuickKind : null
              }
              slotTime24h={slotTime24h}
              onSlotTime24hChange={setSlotTime24hPersist}
            />
            {quickMenu ? (
              <CalendarEventQuickMenu
                payload={quickMenu}
                displayTimes24h={slotTime24h}
                onDisplayTimes24hChange={setSlotTime24hPersist}
                scopeRef={calendarScopeRef}
                onCreateDraft={addScheduled}
                onClose={handleCloseQuickMenu}
                onOpenFullEditor={handleOpenFullEditorFromQuick}
                onPersistExisting={(id, patch) => patchScheduled(id, patch)}
                onDuplicate={handleDuplicateEvent}
                onDelete={removeScheduled}
                onRsvpChange={handleRsvpChange}
                onDraftSelectionBump={bumpDraftSelection}
                onDraftKindChange={setDraftQuickKind}
              />
            ) : null}
          </div>
        </div>

        <CalendarEventEditorDialog
          open={editorOpen}
          mode={editorMode}
          initial={editorEvent}
          createRange={editorMode === "create" ? createRange : null}
          createPrefill={editorMode === "create" ? createPrefill : null}
          onClose={() => {
            setEditorOpen(false);
            setCreateRange(null);
            setCreatePrefill(null);
          }}
          onSave={handleSaveEvent}
          onDelete={removeScheduled}
        />

        <CalendarTemplateEditorDialog
          open={templateDialogOpen}
          mode={templateMode}
          initial={templateInitial}
          onClose={() => {
            setTemplateDialogOpen(false);
            setTemplateInitial(null);
          }}
          onSave={handleSaveTemplate}
          onDelete={templateMode === "edit" ? removeBacklogItem : undefined}
        />
      </HomeMainContent>
    </PageContainer>
  );
}
