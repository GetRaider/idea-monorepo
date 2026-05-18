"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { HomeMainContent, PageContainer } from "@/app/shell.ui";
import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import { defaultAxisTimeZones } from "@/helpers/calendar/calendar-axis-time";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import {
  type CalendarPagePlanningHandlersDeps,
  type GoogleScopePrompt,
  useCalendarPagePlanningHandlers,
} from "@/hooks/calendar/use-calendar-page-planning-handlers";
import { useCalendarPageLocalPrefs } from "@/hooks/calendar/use-calendar-page-local-prefs";
import { useCalendarPageServerGridSync } from "@/hooks/calendar/use-calendar-page-server-grid-sync";
import { useGoogleCalendarPlanningConnection } from "@/hooks/calendar/use-google-calendar-planning-connection";
import { useCalendarStore } from "@/hooks/calendar/use-calendar-store";
import { useTaskActions } from "@/hooks/tasks/useTasks";
import { getEffectiveGoogleRecurrence } from "@/helpers/calendar/google-calendar-recurrence.helper";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Spinner } from "@/components/Spinner/Spinner";
import {
  APP_CHROME_MAIN_INSET,
  APP_CHROME_PAGE_BLOCK_GAP,
} from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";
import {
  type CalendarBacklogEvent,
  type CalendarCreatePrefill,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarKindVisibility,
  DEFAULT_CALENDAR_KIND_VISIBILITY,
} from "@/types/calendar.types";

import { CalendarEventEditorDialog } from "../event/EditorDialog";
import {
  CalendarEventQuickMenu,
  type CalendarQuickMenuPayload,
} from "../event/QuickMenu";
import { CalendarTemplateEditorDialog } from "../event/TemplateEditorDialog";
import { PageHeader } from "./Header";
import {
  PlanningCalendar,
  type PlanningCalendarHandle,
} from "../planner/Planner";
import { CalendarPlannerMainColumn } from "../planner/MainColumn";
import { CalendarPlannerSidebarColumn } from "../planner/SidebarColumn";
import { GoogleCalendarRecurrenceScopeDialog } from "../event/GoogleRecurrenceScopeDialog";

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
    mergeGoogleCalendarSync,
    removeGoogleImportedEvents,
    removeGoogleSeriesByMasterId,
    setAxisTimeZones,
    setKindColor,
    setGoogleCalendarColor,
    syncExternalGridEvents,
  } = useCalendarStore();

  const { updateTask } = useTaskActions();
  const isGuest = useIsAnonymous();

  const { bumpServerCalendar, handleVisibleRangeChange } =
    useCalendarPageServerGridSync(isGuest, syncExternalGridEvents);

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

  const {
    slotTime24h,
    setSlotTime24hPersist,
    calendarSidebarCollapsed,
    toggleCalendarSidebar,
  } = useCalendarPageLocalPrefs(planningCalendarRef);

  const draftSelectionHighlight = useMemo(() => {
    if (!quickMenu || quickMenu.mode !== "draft") return null;
    return {
      start: quickMenu.start,
      endExclusive: quickMenu.fcSelectionEnd,
      allDay: quickMenu.allDay,
    };
  }, [quickMenu]);

  const calendarColorTheme = useMemo(
    () =>
      state
        ? {
            kindColors: state.kindColors,
            googleCalendarColor: state.googleCalendarColor,
          }
        : undefined,
    [state],
  );

  const bumpDraftSelection = useCallback(() => {
    setDraftSelectionVersion((v) => v + 1);
  }, []);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState<"create" | "edit">("create");
  const [templateInitial, setTemplateInitial] =
    useState<CalendarBacklogEvent | null>(null);

  const [kindVisibility, setKindVisibility] = useState<CalendarKindVisibility>(
    DEFAULT_CALENDAR_KIND_VISIBILITY,
  );
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(true);
  const [googleScopePrompt, setGoogleScopePrompt] =
    useState<GoogleScopePrompt | null>(null);
  const [googleDeletePrompt, setGoogleDeletePrompt] =
    useState<CalendarEvent | null>(null);

  const {
    googleCalendarLabel,
    googleCalendarConnected,
    syncGoogleIfEnabled,
    pushGoogleThenSync,
  } = useGoogleCalendarPlanningConnection({
    calendarStoreReady: !!state,
    showGoogleCalendar,
    mergeGoogleCalendarSync,
    removeGoogleImportedEvents,
  });

  const planningHandlersDeps = useMemo(
    (): CalendarPagePlanningHandlersDeps => ({
      planningCalendarRef,
      state,
      isGuest,
      bumpServerCalendar,
      replaceScheduled,
      patchScheduled,
      addScheduled,
      removeScheduled,
      removeGoogleSeriesByMasterId,
      updateTask,
      editorMode,
      setEditorMode,
      setEditorEvent,
      setCreateRange,
      setCreatePrefill,
      setEditorOpen,
      setQuickMenu,
      setDraftQuickKind,
      googleScopePrompt,
      setGoogleScopePrompt,
      setGoogleDeletePrompt,
      googleDeletePrompt,
      syncGoogleIfEnabled,
      pushGoogleThenSync,
      showGoogleCalendar,
    }),
    [
      planningCalendarRef,
      state,
      isGuest,
      bumpServerCalendar,
      replaceScheduled,
      patchScheduled,
      addScheduled,
      removeScheduled,
      removeGoogleSeriesByMasterId,
      updateTask,
      editorMode,
      setEditorMode,
      setEditorEvent,
      setCreateRange,
      setCreatePrefill,
      setEditorOpen,
      setQuickMenu,
      setDraftQuickKind,
      googleScopePrompt,
      setGoogleScopePrompt,
      setGoogleDeletePrompt,
      googleDeletePrompt,
      syncGoogleIfEnabled,
      pushGoogleThenSync,
      showGoogleCalendar,
    ],
  );

  const {
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
  } = useCalendarPagePlanningHandlers(planningHandlersDeps);

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
        <HomeMainContent
          withNavSidebar={false}
          className={cn("flex min-h-0 flex-col", APP_CHROME_MAIN_INSET)}
        >
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
        className={cn(
          "flex min-h-0 flex-col max-lg:overflow-y-auto lg:overflow-hidden",
          APP_CHROME_MAIN_INSET,
        )}
      >
        <PageHeader onCreateEvent={openFullCreateDialog} />

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col lg:flex-row",
            APP_CHROME_PAGE_BLOCK_GAP,
          )}
        >
          <CalendarPlannerSidebarColumn
            collapsed={calendarSidebarCollapsed}
            onToggleCollapse={toggleCalendarSidebar}
            panelProps={{
              containerRef: backlogContainerRef,
              items: state.backlog,
              kindVisibility,
              onKindVisibilityChange: setKindVisibility,
              onPickCalendarDay: (d) =>
                planningCalendarRef.current?.goToDate(d),
              onRequestNewTemplate: openNewTemplate,
              onEditTemplate: openEditTemplate,
              onRemoveItem: removeBacklogItem,
              showGoogleCalendar,
              onShowGoogleCalendarChange: (next) => {
                setShowGoogleCalendar(next);
                if (next) {
                  void syncGoogleIfEnabled({ show: true });
                }
              },
              googleCalendarLabel,
              kindColors: state.kindColors,
              googleCalendarColor: state.googleCalendarColor,
              onKindColorChange: setKindColor,
              onGoogleCalendarColorChange: setGoogleCalendarColor,
            }}
          />
          <CalendarPlannerMainColumn
            calendarSidebarCollapsed={calendarSidebarCollapsed}
            onToggleSidebar={toggleCalendarSidebar}
            calendarScopeRef={calendarScopeRef}
          >
            <PlanningCalendar
              ref={planningCalendarRef}
              axisTimeZones={state?.axisTimeZones ?? defaultAxisTimeZones()}
              onAxisTimeZonesChange={setAxisTimeZones}
              events={
                showGoogleCalendar
                  ? state.events
                  : state.events.filter(
                      (e) => !e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
                    )
              }
              backlog={state.backlog}
              backlogContainerRef={backlogContainerRef}
              visibleKinds={kindVisibility}
              onSelectRange={handleSelectRange}
              onEventClick={handlePlanningEventClick}
              onEventReceive={handlePlanningEventReceive}
              onEventTimesUpdated={handleEventTimesUpdated}
              draftSelectionHighlight={draftSelectionHighlight}
              draftSelectionVersion={draftSelectionVersion}
              draftSelectionKind={
                quickMenu?.mode === "draft" ? draftQuickKind : null
              }
              slotTime24h={slotTime24h}
              onSlotTime24hChange={setSlotTime24hPersist}
              calendarColorTheme={calendarColorTheme}
              onVisibleRangeChange={
                isGuest ? undefined : handleVisibleRangeChange
              }
            />
            {quickMenu ? (
              <CalendarEventQuickMenu
                payload={quickMenu}
                displayTimes24h={slotTime24h}
                onDisplayTimes24hChange={setSlotTime24hPersist}
                scopeRef={calendarScopeRef}
                googleCalendarConnected={googleCalendarConnected}
                onCreateDraft={handleCreateDraftFromQuick}
                onClose={handleCloseQuickMenu}
                onOpenFullEditor={handleOpenFullEditorFromQuick}
                onPersistExisting={persistExistingAndMaybePush}
                onDuplicate={handleDuplicateEvent}
                onDeleteEvent={handleDeleteGoogleAware}
                onRsvpChange={handleRsvpChange}
                onDraftSelectionBump={bumpDraftSelection}
                onDraftKindChange={setDraftQuickKind}
                calendarColorTheme={calendarColorTheme}
              />
            ) : null}
          </CalendarPlannerMainColumn>
        </div>

        <CalendarEventEditorDialog
          open={editorOpen}
          mode={editorMode}
          initial={editorEvent}
          createRange={editorMode === "create" ? createRange : null}
          createPrefill={editorMode === "create" ? createPrefill : null}
          googleCalendarConnected={googleCalendarConnected}
          onClose={() => {
            setEditorOpen(false);
            setCreateRange(null);
            setCreatePrefill(null);
          }}
          onSave={handleSaveEvent}
          onDeleteRequest={handleDeleteGoogleAware}
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

        <GoogleCalendarRecurrenceScopeDialog
          intent="edit"
          open={googleScopePrompt !== null}
          onClose={() => setGoogleScopePrompt(null)}
          onChoose={applyGoogleScopeChoice}
        />

        <GoogleCalendarRecurrenceScopeDialog
          intent="delete"
          open={googleDeletePrompt !== null}
          followingOptionDisabled={
            googleDeletePrompt !== null &&
            !getEffectiveGoogleRecurrence(googleDeletePrompt)
          }
          onClose={() => setGoogleDeletePrompt(null)}
          onChoose={applyGoogleDeleteScopeChoice}
        />
      </HomeMainContent>
    </PageContainer>
  );
}
