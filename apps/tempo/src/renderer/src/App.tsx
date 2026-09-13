import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  formatHmsClock,
  formatStageClock,
  getDisplayedElapsedSeconds,
  getRemainingSeconds,
  shouldAutoStopTimer,
  shouldNotifyStopwatchGoal,
} from "../../helpers/elapsed.helper";
import { isDefaultBreakSessionName } from "../../helpers/break.helper";
import { resolveFocusViewState } from "../../helpers/focus-view.helper";
import {
  DEFAULT_APP_SETTINGS,
  resolveBreakDurationMinutes,
  resolveDurationMinutes,
} from "../../helpers/settings.helper";
import {
  playGoalReachedSound,
  playTimerEndedSound,
  unlockTimerSound,
} from "../../helpers/timer-sound.helper";
import {
  TIMER_MIN_PLANNED_SECONDS,
  type FocusRecord,
  type SavedSession,
  type TimerMode,
} from "../../shared/records.types";
import type { AppSettings } from "../../shared/settings.types";

import type { AppScreen } from "./App.types";
import {
  AnalyticsSection,
  AppTopBar,
  BreakOfferDialog,
  HistorySection,
  ManualRecordDialog,
  SavedSessionDialog,
  SettingsSection,
  StopDialog,
} from "./components";
import { formatGoalLabel } from "./components/ProgressRail";
import { FocusStage } from "./focus/FocusStage";

export function App() {
  const [mode, setMode] = useState<TimerMode>(DEFAULT_APP_SETTINGS.defaultMode);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [saveToBacklog, setSaveToBacklog] = useState(
    DEFAULT_APP_SETTINGS.defaultSaveNewSessions,
  );
  const [durationSeconds, setDurationSeconds] = useState(
    resolveDurationMinutes(DEFAULT_APP_SETTINGS) * 60,
  );
  const [activeFocusRecord, setActiveFocusRecord] = useState<FocusRecord | null>(
    null,
  );
  const [activeBreakRecord, setActiveBreakRecord] = useState<FocusRecord | null>(
    null,
  );
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activityErrorMessage, setActivityErrorMessage] = useState<string | null>(
    null,
  );
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FocusRecord | null>(null);
  const [editingSession, setEditingSession] = useState<SavedSession | null>(
    null,
  );
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [stopDialogTarget, setStopDialogTarget] = useState<StopDialogTarget>(
    "focus",
  );
  const [stopDialogCanSave, setStopDialogCanSave] = useState(true);
  const [isBreakOfferDialogOpen, setIsBreakOfferDialogOpen] = useState(false);
  const [breakOfferMinutes, setBreakOfferMinutes] = useState(
    DEFAULT_APP_SETTINGS.breakDurationMinutes,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [activeScreen, setActiveScreen] = useState<AppScreen>("focus");
  const handledAutoStopRecordId = useRef<string | null>(null);
  const handledAutoStopBreakRecordId = useRef<string | null>(null);
  const handledGoalRecordId = useRef<string | null>(null);
  const didApplyLaunchSettings = useRef(false);

  const refreshState = useCallback(async () => {
    const [nextActiveState, nextRecords, nextSessions, loadedSettings] =
      await Promise.all([
        window.tempo.getActiveState(),
        window.tempo.listRecords(),
        window.tempo.listSessions(),
        window.tempo.getSettings(),
      ]);
    setActiveFocusRecord(nextActiveState.focus);
    setActiveBreakRecord(nextActiveState.break);
    setRecords(nextRecords);
    setSessions(nextSessions);
    setSettings(loadedSettings);
    setBreakOfferMinutes(resolveBreakDurationMinutes(loadedSettings));
    if (nextActiveState.focus !== null) {
      setMode(nextActiveState.focus.mode);
      setName(nextActiveState.focus.name);
      setScope(nextActiveState.focus.scope ?? "");
      setSelectedSessionId(nextActiveState.focus.sessionId);
      didApplyLaunchSettings.current = true;
      return;
    }

    if (nextActiveState.break !== null) {
      didApplyLaunchSettings.current = true;
      return;
    }

    if (!didApplyLaunchSettings.current) {
      setMode(loadedSettings.defaultMode);
      setDurationSeconds(resolveDurationMinutes(loadedSettings) * 60);
      setSaveToBacklog(loadedSettings.defaultSaveNewSessions);
      didApplyLaunchSettings.current = true;
    }
  }, []);

  useEffect(() => {
    refreshState().catch((error: unknown) => {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load records",
      );
    });
  }, [refreshState]);

  useEffect(() => {
    if (!didApplyLaunchSettings.current || durationSeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void window.tempo.updateSettings({
        lastDurationMinutes: Math.min(
          60,
          Math.max(1, Math.round(durationSeconds / 60)),
        ),
      });
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [durationSeconds]);

  useEffect(() => {
    const isFocusRunning =
      activeFocusRecord !== null && activeFocusRecord.segmentStartedAt !== null;
    const isBreakRunning =
      activeBreakRecord !== null && activeBreakRecord.segmentStartedAt !== null;
    if (!isFocusRunning && !isBreakRunning) {
      return;
    }

    const intervalId = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [activeFocusRecord, activeBreakRecord]);

  const focusElapsedSeconds = useMemo(() => {
    if (activeFocusRecord === null) {
      return 0;
    }

    return getDisplayedElapsedSeconds(activeFocusRecord, nowMs);
  }, [activeFocusRecord, nowMs]);

  const breakElapsedSeconds = useMemo(() => {
    if (activeBreakRecord === null) {
      return 0;
    }

    return getDisplayedElapsedSeconds(activeBreakRecord, nowMs);
  }, [activeBreakRecord, nowMs]);

  useEffect(() => {
    if (activeFocusRecord === null) {
      if (!isStopDialogOpen || stopDialogTarget !== "focus") {
        handledAutoStopRecordId.current = null;
      }
      handledGoalRecordId.current = null;
      return;
    }

    if (isStopDialogOpen && stopDialogTarget === "focus") {
      return;
    }

    if (
      !shouldAutoStopTimer(
        focusElapsedSeconds,
        activeFocusRecord.mode,
        activeFocusRecord.plannedSeconds,
      )
    ) {
      return;
    }

    if (handledAutoStopRecordId.current === activeFocusRecord.id) {
      return;
    }

    handledAutoStopRecordId.current = activeFocusRecord.id;
    playEndSound(settings);
    const shouldConfirm = settings.confirmOnStop;
    const canSave = focusElapsedSeconds > 0;
    const shouldPause = activeFocusRecord.segmentStartedAt !== null;
    void (async () => {
      try {
        if (shouldPause) {
          await window.tempo.pause();
          await refreshState();
        }
        if (shouldConfirm) {
          setStopDialogTarget("focus");
          setStopDialogCanSave(canSave);
          setIsStopDialogOpen(true);
          return;
        }
        if (canSave) {
          await window.tempo.stop();
          setScope("");
          await refreshState();
          if (settings.offerBreakTimer) {
            setBreakOfferMinutes(resolveBreakDurationMinutes(settings));
            setIsBreakOfferDialogOpen(true);
          }
          return;
        }
        await window.tempo.discard();
        setScope("");
        await refreshState();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to stop",
        );
      }
    })();
  }, [
    activeFocusRecord,
    focusElapsedSeconds,
    isStopDialogOpen,
    refreshState,
    settings,
    stopDialogTarget,
  ]);

  useEffect(() => {
    if (activeBreakRecord === null) {
      if (!isStopDialogOpen || stopDialogTarget !== "break") {
        handledAutoStopBreakRecordId.current = null;
      }
      return;
    }

    if (isStopDialogOpen && stopDialogTarget === "break") {
      return;
    }

    if (
      !shouldAutoStopTimer(
        breakElapsedSeconds,
        activeBreakRecord.mode,
        activeBreakRecord.plannedSeconds,
      )
    ) {
      return;
    }

    if (handledAutoStopBreakRecordId.current === activeBreakRecord.id) {
      return;
    }

    handledAutoStopBreakRecordId.current = activeBreakRecord.id;
    playEndSound(settings);
    const shouldConfirm = settings.confirmOnStop;
    const canSave = breakElapsedSeconds > 0;
    const shouldPause = activeBreakRecord.segmentStartedAt !== null;
    void (async () => {
      try {
        if (shouldPause) {
          await window.tempo.pauseBreak();
          await refreshState();
        }
        if (shouldConfirm) {
          setStopDialogTarget("break");
          setStopDialogCanSave(canSave);
          setIsStopDialogOpen(true);
          return;
        }
        if (canSave) {
          await window.tempo.stopBreak();
          await refreshState();
          return;
        }
        await window.tempo.discardBreak();
        await refreshState();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to stop break",
        );
      }
    })();
  }, [
    activeBreakRecord,
    breakElapsedSeconds,
    isStopDialogOpen,
    refreshState,
    settings,
    stopDialogTarget,
  ]);

  useEffect(() => {
    if (activeFocusRecord === null || activeFocusRecord.segmentStartedAt === null) {
      return;
    }

    if (
      !shouldNotifyStopwatchGoal(
        focusElapsedSeconds,
        activeFocusRecord.mode,
        activeFocusRecord.plannedSeconds,
      )
    ) {
      return;
    }

    if (handledGoalRecordId.current === activeFocusRecord.id) {
      return;
    }

    handledGoalRecordId.current = activeFocusRecord.id;
    playGoalSound(settings);
  }, [activeFocusRecord, focusElapsedSeconds, settings]);

  const viewState = resolveFocusViewState(activeFocusRecord, activeBreakRecord);
  const isBreakRunning =
    activeBreakRecord !== null && activeBreakRecord.segmentStartedAt !== null;
  const isIdle = viewState === "idle";
  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );
  const isBacklogSelected = selectedSession !== undefined;
  const isBreakSelected =
    selectedSession !== undefined &&
    isDefaultBreakSessionName(selectedSession.name);
  const hasSessionName = name.trim().length > 0;
  const canStart =
    hasSessionName &&
    (isBreakSelected ||
      mode !== "timer" ||
      durationSeconds >= TIMER_MIN_PLANNED_SECONDS);
  const composerPlannedSeconds = durationSeconds > 0 ? durationSeconds : 0;
  const stageClock = resolveStageClock({
    viewState,
    mode,
    composerPlannedSeconds,
    focusElapsedSeconds,
    breakElapsedSeconds,
    focusRecord: activeFocusRecord,
    breakRecord: activeBreakRecord,
  });
  const headerStatus = resolveHeaderStatus(viewState, isBreakRunning);
  const pausedFocusLabel =
    viewState === "focusPausedBreakRunning" && activeFocusRecord
      ? `${activeFocusRecord.name} paused · ${formatHmsClock(focusElapsedSeconds)}`
      : null;

  async function patchSettings(
    patch: Partial<AppSettings>,
  ): Promise<AppSettings> {
    const nextSettings = await window.tempo.updateSettings(patch);
    setSettings(nextSettings);
    if (isIdle) {
      if (patch.defaultMode !== undefined) {
        setMode(nextSettings.defaultMode);
      }
      if (patch.durationPreset !== undefined) {
        setDurationSeconds(resolveDurationMinutes(nextSettings) * 60);
      }
      if (patch.defaultSaveNewSessions !== undefined && !isBacklogSelected) {
        setSaveToBacklog(nextSettings.defaultSaveNewSessions);
      }
    }
    return nextSettings;
  }

  async function finalizeFocusStop(offerBreak = true) {
    await window.tempo.stop();
    setScope("");
    await refreshState();
    if (offerBreak && settings.offerBreakTimer) {
      setBreakOfferMinutes(resolveBreakDurationMinutes(settings));
      setIsBreakOfferDialogOpen(true);
    }
  }

  async function requestStop(recordedSeconds: number, confirmOnStop: boolean) {
    setErrorMessage(null);
    try {
      await freezeRunningFocus();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to pause",
      );
      return;
    }

    if (confirmOnStop) {
      setStopDialogTarget("focus");
      setStopDialogCanSave(recordedSeconds > 0);
      setIsStopDialogOpen(true);
      return;
    }

    if (recordedSeconds > 0) {
      await handleSaveStop();
      return;
    }

    await handleDiscardStop();
  }

  async function requestBreakStop(
    recordedSeconds: number,
    confirmOnStop: boolean,
  ) {
    setErrorMessage(null);
    try {
      await freezeRunningBreak();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to pause break",
      );
      return;
    }

    if (confirmOnStop) {
      setStopDialogTarget("break");
      setStopDialogCanSave(recordedSeconds > 0);
      setIsStopDialogOpen(true);
      return;
    }

    if (recordedSeconds > 0) {
      await handleSaveBreakStop();
      return;
    }

    await handleDiscardBreakStop();
  }

  async function freezeRunningFocus() {
    if (
      activeFocusRecord === null ||
      activeFocusRecord.segmentStartedAt === null
    ) {
      return;
    }

    await window.tempo.pause();
    await refreshState();
  }

  async function freezeRunningBreak() {
    if (
      activeBreakRecord === null ||
      activeBreakRecord.segmentStartedAt === null
    ) {
      return;
    }

    await window.tempo.pauseBreak();
    await refreshState();
  }

  function handleComposerNameChange(nextName: string) {
    setName(nextName);
    if (selectedSessionId !== null) {
      setSelectedSessionId(null);
      setSaveToBacklog(settings.defaultSaveNewSessions);
    }
  }

  function handleSelectBacklog(sessionId: string | null) {
    setSelectedSessionId(sessionId);
    if (sessionId === null) {
      return;
    }

    const session = sessions.find((item) => item.id === sessionId);
    if (session) {
      setName(session.name);
      setSaveToBacklog(false);
      if (isDefaultBreakSessionName(session.name)) {
        setMode("timer");
        setDurationSeconds(settings.breakDurationMinutes * 60);
      }
    }
  }

  async function handleStart() {
    setErrorMessage(null);
    setIsBusy(true);
    unlockTimerSound();
    try {
      if (isBreakSelected) {
        await window.tempo.startBreak({
          plannedSeconds: settings.breakDurationMinutes * 60,
        });
      } else {
        await window.tempo.start({
          name,
          scope,
          kind: isBacklogSelected ? "backlog" : "unknown",
          sessionId: selectedSessionId,
          saveToBacklog: !isBacklogSelected && saveToBacklog,
          mode,
          plannedSeconds: durationSeconds > 0 ? durationSeconds : null,
        });
      }
      await refreshState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePause() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await window.tempo.pause();
      await refreshState();
      if (settings.offerBreakTimer) {
        setBreakOfferMinutes(resolveBreakDurationMinutes(settings));
        setIsBreakOfferDialogOpen(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to pause",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResume() {
    if (isBreakRunning) {
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);
    try {
      await window.tempo.resume();
      await refreshState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to resume",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartBreak(plannedMinutes: number) {
    setErrorMessage(null);
    setIsBusy(true);
    unlockTimerSound();
    try {
      await window.tempo.startBreak({
        plannedSeconds: plannedMinutes * 60,
      });
      setIsBreakOfferDialogOpen(false);
      await refreshState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start break",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function closeStopDialog(): Promise<void> {
    setIsStopDialogOpen(false);
    await refreshState();
  }

  async function handleSaveStop() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await finalizeFocusStop();
      await closeStopDialog();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save",
      );
      await closeStopDialog();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDiscardStop() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await window.tempo.discard();
      setScope("");
      await closeStopDialog();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to discard",
      );
      await closeStopDialog();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveBreakStop() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await window.tempo.stopBreak();
      await closeStopDialog();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save break",
      );
      await closeStopDialog();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDiscardBreakStop() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await window.tempo.discardBreak();
      await closeStopDialog();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to discard break",
      );
      await closeStopDialog();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="tempo-grain flex h-full min-h-full flex-col bg-tempo-bg text-tempo-text">
      <AppTopBar
        activeScreen={activeScreen}
        statusLabel={headerStatus.label}
        isLive={headerStatus.isLive}
        onNavigate={setActiveScreen}
      />
      {activeScreen === "focus" ? (
        <FocusStage
          viewState={viewState}
          mode={mode}
          name={
            viewState === "breakOnly" && activeBreakRecord
              ? activeBreakRecord.name
              : name
          }
          scope={scope}
          durationSeconds={durationSeconds}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          saveToBacklog={saveToBacklog}
          isBreakSelected={isBreakSelected}
          breakDurationMinutes={settings.breakDurationMinutes}
          clockValue={stageClock.value}
          overGoal={stageClock.overGoal}
          elapsedSeconds={stageClock.elapsedSeconds}
          targetSeconds={stageClock.targetSeconds}
          leftLabel={stageClock.leftLabel}
          rightLabel={stageClock.rightLabel}
          railDone={stageClock.railDone}
          isBusy={isBusy}
          canStart={canStart}
          errorMessage={errorMessage}
          activityErrorMessage={activityErrorMessage}
          pausedFocusLabel={pausedFocusLabel}
          isLive={headerStatus.isLive}
          onModeChange={(nextMode) => {
            setMode(nextMode);
            if (
              nextMode === "timer" &&
              durationSeconds < TIMER_MIN_PLANNED_SECONDS
            ) {
              setDurationSeconds(10 * 60);
            }
          }}
          onNameChange={handleComposerNameChange}
          onScopeChange={setScope}
          onDurationChange={setDurationSeconds}
          onSaveToBacklogChange={setSaveToBacklog}
          onSelectActivity={handleSelectBacklog}
          onEditActivity={setEditingSession}
          onDeleteActivity={async (sessionId) => {
            setActivityErrorMessage(null);
            try {
              await window.tempo.deleteSession(sessionId);
              if (selectedSessionId === sessionId) {
                setSelectedSessionId(null);
                setName("");
              }
              await refreshState();
            } catch (error) {
              setActivityErrorMessage(
                error instanceof Error
                  ? error.message
                  : "Could not delete activity",
              );
            }
          }}
          onStart={() => {
            void handleStart();
          }}
          onPause={() => {
            void handlePause();
          }}
          onResume={() => {
            void handleResume();
          }}
          onStop={() => {
            if (activeFocusRecord !== null) {
              handledAutoStopRecordId.current = activeFocusRecord.id;
            }
            void requestStop(focusElapsedSeconds, settings.confirmOnStop);
          }}
          onStopBreak={() => {
            if (activeBreakRecord !== null) {
              handledAutoStopBreakRecordId.current = activeBreakRecord.id;
            }
            void requestBreakStop(breakElapsedSeconds, settings.confirmOnStop);
          }}
        />
      ) : null}
      {activeScreen === "history" ? (
        <HistorySection
          records={records}
          sessions={sessions}
          onAdd={() => {
            setEditingRecord(null);
            setIsManualDialogOpen(true);
          }}
          onEdit={(record) => {
            setEditingRecord(record);
            setIsManualDialogOpen(true);
          }}
          onDelete={async (recordId) => {
            await window.tempo.deleteRecord(recordId);
            await refreshState();
          }}
        />
      ) : null}
      {activeScreen === "analytics" ? (
        <AnalyticsSection records={records} sessions={sessions} />
      ) : null}
      {activeScreen === "settings" ? (
        <SettingsSection
          settings={settings}
          onChange={(patch) => {
            void patchSettings(patch);
          }}
          onImport={async () => {
            const imported = await window.tempo.importData();
            if (imported) {
              didApplyLaunchSettings.current = false;
              await refreshState();
            }
          }}
        />
      ) : null}
      {editingSession !== null ? (
        <SavedSessionDialog
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={async (input) => {
            const updatedSession = await window.tempo.updateSession(input);
            if (selectedSessionId === updatedSession.id) {
              setName(updatedSession.name);
            }
            await refreshState();
          }}
        />
      ) : null}
      {isManualDialogOpen ? (
        <ManualRecordDialog
          record={editingRecord}
          sessions={sessions}
          defaultSaveNewSessions={settings.defaultSaveNewSessions}
          onClose={() => {
            setIsManualDialogOpen(false);
            setEditingRecord(null);
          }}
          onCreate={async (input) => {
            await window.tempo.addManual(input);
            await refreshState();
          }}
          onUpdate={async (input) => {
            await window.tempo.updateRecord(input);
            await refreshState();
          }}
        />
      ) : null}
      {isStopDialogOpen ? (
        <StopDialog
          title={
            stopDialogTarget === "break" ? "Stop break?" : "Stop session?"
          }
          body={
            stopDialogTarget === "break"
              ? "Save keeps this break in history. Discard removes it."
              : undefined
          }
          canSave={stopDialogCanSave}
          isBusy={isBusy}
          onDismiss={() => {
            void closeStopDialog();
          }}
          onSave={() => {
            if (stopDialogTarget === "break") {
              void handleSaveBreakStop();
              return;
            }
            void handleSaveStop();
          }}
          onDiscard={() => {
            if (stopDialogTarget === "break") {
              void handleDiscardBreakStop();
              return;
            }
            void handleDiscardStop();
          }}
        />
      ) : null}
      {isBreakOfferDialogOpen ? (
        <BreakOfferDialog
          durationMinutes={breakOfferMinutes}
          isBusy={isBusy}
          onDurationChange={(minutes) => {
            if (Number.isFinite(minutes) && minutes >= 1 && minutes <= 60) {
              setBreakOfferMinutes(Math.round(minutes));
            }
          }}
          onStartBreak={() => {
            void handleStartBreak(breakOfferMinutes);
          }}
          onDismiss={() => {
            setIsBreakOfferDialogOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function playEndSound(settings: AppSettings) {
  if (!settings.soundEnabled) {
    return;
  }

  playTimerEndedSound(settings.soundVolume);
}

function playGoalSound(settings: AppSettings) {
  if (!settings.soundEnabled) {
    return;
  }

  playGoalReachedSound(settings.soundVolume);
}

function resolveHeaderStatus(
  viewState: ReturnType<typeof resolveFocusViewState>,
  isBreakRunning: boolean,
): { label: string; isLive: boolean } {
  if (viewState === "idle") {
    return { label: "Ready", isLive: false };
  }
  if (viewState === "focusRunning") {
    return { label: "Running", isLive: true };
  }
  if (viewState === "focusPaused") {
    return { label: "Paused", isLive: false };
  }
  if (viewState === "breakOnly" || viewState === "focusPausedBreakRunning") {
    return {
      label: isBreakRunning ? "Break" : "Paused",
      isLive: isBreakRunning,
    };
  }
  return { label: "Ready", isLive: false };
}

function resolveStageClock({
  viewState,
  mode,
  composerPlannedSeconds,
  focusElapsedSeconds,
  breakElapsedSeconds,
  focusRecord,
  breakRecord,
}: StageClockInput): StageClock {
  const showBreakClock =
    viewState === "breakOnly" || viewState === "focusPausedBreakRunning";
  if (showBreakClock && breakRecord !== null) {
    const remaining =
      getRemainingSeconds(breakElapsedSeconds, breakRecord.plannedSeconds) ?? 0;
    const target = breakRecord.plannedSeconds ?? 0;
    const done = target > 0 && remaining === 0;
    return {
      value: formatStageClock(remaining),
      elapsedSeconds: breakElapsedSeconds,
      targetSeconds: target,
      leftLabel: "left",
      rightLabel: done ? "goal reached" : formatGoalLabel(target),
      railDone: done,
      overGoal: done,
    };
  }

  const plannedSeconds =
    focusRecord?.plannedSeconds ??
    (composerPlannedSeconds > 0 ? composerPlannedSeconds : 0);
  const hasGoal = plannedSeconds > 0;
  const remaining = getRemainingSeconds(focusElapsedSeconds, plannedSeconds);
  const done =
    hasGoal &&
    ((mode === "timer" && remaining === 0 && viewState !== "idle") ||
      (mode === "stopwatch" &&
        remaining === 0 &&
        viewState !== "idle"));

  if (mode === "timer") {
    const displaySeconds =
      viewState === "idle"
        ? composerPlannedSeconds
        : (remaining ?? composerPlannedSeconds);
    return {
      value: formatStageClock(displaySeconds),
      elapsedSeconds: viewState === "idle" ? 0 : focusElapsedSeconds,
      targetSeconds: plannedSeconds,
      leftLabel: "left",
      rightLabel: done ? "goal reached" : formatGoalLabel(plannedSeconds),
      railDone: done,
      overGoal: done,
    };
  }

  return {
    value: formatStageClock(viewState === "idle" ? 0 : focusElapsedSeconds),
    elapsedSeconds: viewState === "idle" ? 0 : focusElapsedSeconds,
    targetSeconds: plannedSeconds,
    leftLabel: "elapsed",
    rightLabel: done
      ? "goal reached"
      : hasGoal
        ? formatGoalLabel(plannedSeconds)
        : "no goal",
    railDone: done,
    overGoal: done,
  };
}

interface StageClock {
  value: string;
  elapsedSeconds: number;
  targetSeconds: number;
  leftLabel: string;
  rightLabel: string;
  railDone: boolean;
  overGoal: boolean;
}

interface StageClockInput {
  viewState: ReturnType<typeof resolveFocusViewState>;
  mode: TimerMode;
  composerPlannedSeconds: number;
  focusElapsedSeconds: number;
  breakElapsedSeconds: number;
  focusRecord: FocusRecord | null;
  breakRecord: FocusRecord | null;
}

type StopDialogTarget = "focus" | "break";
