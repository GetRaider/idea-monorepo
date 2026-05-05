"use client";

import { useCallback, useRef, useState } from "react";

import {
  AppPageSubtitle,
  AppPageTitle,
  HomeMainContent,
  PageContainer,
  WelcomeSection,
} from "@/app/shell.ui";
import { PrimaryButton } from "@/components/Buttons";
import { PlusIcon } from "@/components/Icons";
import { useCalendarStore } from "@/hooks/calendar/use-calendar-store";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Spinner } from "@/components/Spinner/Spinner";
import type {
  CalendarBacklogItem,
  CalendarCreatePrefill,
  CalendarKindVisibility,
  CalendarRsvpStatus,
  CalendarScheduledEvent,
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
  time_block: true,
  general: true,
  task_event: true,
};

export function CalendarPage() {
  const planningCalendarRef = useRef<PlanningCalendarHandle>(null);
  const backlogContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarScopeRef = useRef<HTMLDivElement | null>(null);
  const {
    state,
    addScheduled,
    updateScheduled,
    removeScheduled,
    addBacklogItem,
    removeBacklogItem,
    updateBacklogItem,
  } = useCalendarStore();

  const [, setCurrentPage] = useState("calendar");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorEvent, setEditorEvent] = useState<CalendarScheduledEvent | null>(
    null,
  );
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

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState<"create" | "edit">("create");
  const [templateInitial, setTemplateInitial] =
    useState<CalendarBacklogItem | null>(null);

  const [kindVisibility, setKindVisibility] = useState<CalendarKindVisibility>(
    DEFAULT_KIND_VISIBILITY,
  );

  const openFullCreateDialog = useCallback(() => {
    setQuickMenu(null);
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
    ) => {
      const inclusiveEnd = selectEndToInclusiveEnd(end, allDay);
      setQuickMenu({
        mode: "draft",
        start,
        end: inclusiveEnd,
        allDay,
        anchor,
      });
    },
    [],
  );

  const handlePlanningEventClick = useCallback(
    (
      event: CalendarScheduledEvent,
      anchor: { clientX: number; clientY: number },
    ) => {
      setQuickMenu({ mode: "existing", event, anchor });
    },
    [],
  );

  const handleOpenFullEditorFromQuick = useCallback(
    (ctx: CalendarOpenFullEditorContext) => {
      if (ctx.mode === "existing" && ctx.event) {
        updateScheduled(ctx.event.id, {
          title: ctx.event.title,
          kind: ctx.event.kind,
          description: ctx.event.description,
          notesAndDocs: ctx.event.notesAndDocs,
          meetingUrl: ctx.event.meetingUrl,
          participants: ctx.event.participants,
          timeZone: ctx.event.timeZone,
          repeat: ctx.event.repeat,
        });
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
          kind: ctx.quickFields.kind,
        });
        setEditorMode("create");
        setEditorEvent(null);
        setCreateRange(ctx.range);
        setEditorOpen(true);
      }
    },
    [updateScheduled],
  );

  const handleSaveEvent = useCallback(
    (event: CalendarScheduledEvent) => {
      if (editorMode === "create") {
        addScheduled(event);
        return;
      }
      updateScheduled(event.id, event);
    },
    [addScheduled, updateScheduled, editorMode],
  );

  const handleEventTimesUpdated = useCallback(
    (
      id: string,
      patch: Pick<CalendarScheduledEvent, "start" | "end" | "allDay">,
    ) => {
      updateScheduled(id, patch);
    },
    [updateScheduled],
  );

  const handleDuplicateEvent = useCallback(
    (event: CalendarScheduledEvent) => {
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
        rsvpStatus: undefined,
        rsvpDeclineReason: undefined,
      });
    },
    [addScheduled],
  );

  const handleRsvpChange = useCallback(
    (id: string, rsvp: CalendarRsvpStatus, declineReason?: string) => {
      updateScheduled(id, {
        rsvpStatus: rsvp,
        rsvpDeclineReason:
          rsvp === "no" ? declineReason?.trim() || undefined : undefined,
      });
    },
    [updateScheduled],
  );

  const openNewTemplate = useCallback(() => {
    setTemplateMode("create");
    setTemplateInitial(null);
    setTemplateDialogOpen(true);
  }, []);

  const openEditTemplate = useCallback((item: CalendarBacklogItem) => {
    setTemplateMode("edit");
    setTemplateInitial(item);
    setTemplateDialogOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(
    (item: CalendarBacklogItem) => {
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
              Plan time blocks, general events, and task windows.
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
          />
          <div ref={calendarScopeRef} className="relative flex min-h-0 flex-1">
            <PlanningCalendar
              ref={planningCalendarRef}
              events={state.events}
              backlog={state.backlog}
              backlogContainerRef={backlogContainerRef}
              visibleKinds={kindVisibility}
              onSelectRange={handleSelectRange}
              onEventClick={handlePlanningEventClick}
              onEventReceive={addScheduled}
              onEventTimesUpdated={handleEventTimesUpdated}
            />
            {quickMenu ? (
              <CalendarEventQuickMenu
                payload={quickMenu}
                scopeRef={calendarScopeRef}
                onClose={() => setQuickMenu(null)}
                onOpenFullEditor={handleOpenFullEditorFromQuick}
                onPersistExisting={(id, patch) => updateScheduled(id, patch)}
                onDuplicate={handleDuplicateEvent}
                onDelete={removeScheduled}
                onRsvpChange={handleRsvpChange}
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
