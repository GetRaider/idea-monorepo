"use client";

import { useCallback, useRef, useState } from "react";

import {
  AppPageSubtitle,
  AppPageTitle,
  HomeMainContent,
  PageContainer,
  WelcomeSection,
} from "@/app/shell.ui";
import { useCalendarStore } from "@/hooks/calendar/use-calendar-store";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Spinner } from "@/components/Spinner/Spinner";
import type { CalendarScheduledEvent } from "@/types/calendar.types";

import { CalendarBacklogPanel } from "./CalendarBacklogPanel";
import { CalendarEventEditorDialog } from "./CalendarEventEditorDialog";
import { PlanningCalendar } from "./PlanningCalendar";

function selectEndToInclusiveEnd(endExclusive: Date, allDay: boolean): Date {
  if (allDay) {
    const d = new Date(endExclusive);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return new Date(endExclusive.getTime() - 1);
}

export function CalendarPage() {
  const backlogContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    state,
    addScheduled,
    updateScheduled,
    removeScheduled,
    addBacklogItem,
    removeBacklogItem,
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

  const openCreateEditor = useCallback(
    (range: { start: Date; end: Date; allDay: boolean } | null) => {
      setEditorMode("create");
      setEditorEvent(null);
      setCreateRange(range);
      setEditorOpen(true);
    },
    [],
  );

  const openEditEditor = useCallback((event: CalendarScheduledEvent) => {
    setEditorMode("edit");
    setCreateRange(null);
    setEditorEvent(event);
    setEditorOpen(true);
  }, []);

  const handleSelectRange = useCallback(
    (start: Date, end: Date, allDay: boolean) => {
      const inclusiveEnd = selectEndToInclusiveEnd(end, allDay);
      openCreateEditor({ start, end: inclusiveEnd, allDay });
    },
    [openCreateEditor],
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
      <HomeMainContent withNavSidebar={false} className="flex min-h-0 flex-col">
        <WelcomeSection>
          <AppPageTitle>Calendar</AppPageTitle>
          <AppPageSubtitle>
            Plan time blocks, mutual events, and focused task windows. Drag from
            the backlog to schedule reusable templates.
          </AppPageSubtitle>
        </WelcomeSection>

        <div className="flex min-h-0 flex-1 gap-4 max-[900px]:flex-col">
          <CalendarBacklogPanel
            containerRef={backlogContainerRef}
            items={state.backlog}
            onAddItem={addBacklogItem}
            onRemoveItem={removeBacklogItem}
          />
          <PlanningCalendar
            events={state.events}
            backlog={state.backlog}
            backlogContainerRef={backlogContainerRef}
            onSelectRange={handleSelectRange}
            onEventClick={openEditEditor}
            onEventReceive={addScheduled}
            onEventTimesUpdated={handleEventTimesUpdated}
          />
        </div>

        <div className="mt-4 shrink-0">
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-violet-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600"
            onClick={() => openCreateEditor(null)}
          >
            New event
          </button>
        </div>
      </HomeMainContent>

      <CalendarEventEditorDialog
        open={editorOpen}
        mode={editorMode}
        initial={editorEvent}
        createRange={editorMode === "create" ? createRange : null}
        onClose={() => {
          setEditorOpen(false);
          setCreateRange(null);
        }}
        onSave={handleSaveEvent}
        onDelete={removeScheduled}
      />
    </PageContainer>
  );
}
