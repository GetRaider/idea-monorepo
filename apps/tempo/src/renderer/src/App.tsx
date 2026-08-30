import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  formatHmsClock,
  formatTimerClock,
  getDisplayedElapsedSeconds,
  getRemainingSeconds,
  shouldAutoStopTimer,
  shouldNotifyStopwatchGoal,
} from "../../helpers/elapsed.helper";
import { parseMinutesInput } from "../../helpers/session.helper";
import {
  DEFAULT_APP_SETTINGS,
  resolveDurationMinutes,
} from "../../helpers/settings.helper";
import {
  playGoalReachedSound,
  playTimerEndedSound,
  unlockTimerSound,
} from "../../helpers/timer-sound.helper";
import type {
  FocusRecord,
  SavedSession,
  TimerMode,
} from "../../shared/records.types";
import type { AppSettings } from "../../shared/settings.types";

import {
  AppShell,
  Brand,
  BrandCopy,
  BrandLogo,
  BrandLogoButton,
  BrandName,
  BrandVersion,
  Button,
  ButtonRow,
  CheckboxField,
  ErrorText,
  Field,
  FieldLabel,
  FocusScreen,
  GlobalStyle,
  Main,
  MainHeader,
  NavButton,
  NavLabel,
  RequiredMark,
  SaveFieldSlot,
  ScreenTitle,
  SetupFields,
  SetupGrid,
  Sidebar,
  StartButtonContent,
  StartPlayIcon,
  TextInput,
} from "./App.styles";
import type { AppScreen } from "./App.types";
import {
  AnalyticsSection,
  BacklogPicker,
  CollapsibleSection,
  DurationDial,
  HistorySection,
  ManualRecordDialog,
  ModeToggle,
  NavIcon,
  SavedSessionDialog,
  SettingsSection,
  StopDialog,
} from "./components";

export function App() {
  const [mode, setMode] = useState<TimerMode>(DEFAULT_APP_SETTINGS.defaultMode);
  const [name, setName] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [saveToBacklog, setSaveToBacklog] = useState(
    DEFAULT_APP_SETTINGS.defaultSaveNewSessions,
  );
  const [durationMinutes, setDurationMinutes] = useState(
    resolveDurationMinutes(DEFAULT_APP_SETTINGS),
  );
  const [activeRecord, setActiveRecord] = useState<FocusRecord | null>(null);
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FocusRecord | null>(null);
  const [editingSession, setEditingSession] = useState<SavedSession | null>(
    null,
  );
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [stopDialogCanSave, setStopDialogCanSave] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [activeScreen, setActiveScreen] = useState<AppScreen>("focus");
  const handledAutoStopRecordId = useRef<string | null>(null);
  const handledGoalRecordId = useRef<string | null>(null);
  const didApplyLaunchSettings = useRef(false);

  const refreshState = useCallback(async () => {
    const [nextActive, nextRecords, nextSessions, loadedSettings] =
      await Promise.all([
        window.tempo.getActive(),
        window.tempo.listRecords(),
        window.tempo.listSessions(),
        window.tempo.getSettings(),
      ]);
    setActiveRecord(nextActive);
    setRecords(nextRecords);
    setSessions(nextSessions);
    setSettings(loadedSettings);
    if (nextActive !== null) {
      setMode(nextActive.mode);
      setName(nextActive.name);
      setSelectedSessionId(nextActive.sessionId);
      didApplyLaunchSettings.current = true;
      return;
    }

    if (!didApplyLaunchSettings.current) {
      setMode(loadedSettings.defaultMode);
      setDurationMinutes(resolveDurationMinutes(loadedSettings));
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
    if (!didApplyLaunchSettings.current || durationMinutes <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void window.tempo.updateSettings({
        lastDurationMinutes: durationMinutes,
      });
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [durationMinutes]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "b"
      ) {
        return;
      }
      event.preventDefault();
      void window.tempo
        .updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
        .then(setSettings);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settings.sidebarCollapsed]);

  useEffect(() => {
    if (activeRecord === null || activeRecord.segmentStartedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [activeRecord]);

  const elapsedSeconds = useMemo(() => {
    if (activeRecord === null) {
      return 0;
    }

    return getDisplayedElapsedSeconds(activeRecord, nowMs);
  }, [activeRecord, nowMs]);

  useEffect(() => {
    if (activeRecord === null) {
      if (!isStopDialogOpen) {
        handledAutoStopRecordId.current = null;
      }
      handledGoalRecordId.current = null;
      return;
    }

    if (isStopDialogOpen) {
      return;
    }

    if (
      !shouldAutoStopTimer(
        elapsedSeconds,
        activeRecord.mode,
        activeRecord.plannedSeconds,
      )
    ) {
      return;
    }

    if (handledAutoStopRecordId.current === activeRecord.id) {
      return;
    }

    handledAutoStopRecordId.current = activeRecord.id;
    playEndSound(settings);
    if (settings.confirmOnStop) {
      setStopDialogCanSave(elapsedSeconds > 0);
      setIsStopDialogOpen(true);
      return;
    }

    if (elapsedSeconds > 0) {
      void window.tempo
        .stop()
        .then(() => refreshState())
        .catch((error: unknown) => {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to save",
          );
        });
      return;
    }

    void window.tempo
      .discard()
      .then(() => refreshState())
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to discard",
        );
      });
  }, [activeRecord, elapsedSeconds, isStopDialogOpen, refreshState, settings]);

  useEffect(() => {
    if (activeRecord === null || activeRecord.segmentStartedAt === null) {
      return;
    }

    if (
      !shouldNotifyStopwatchGoal(
        elapsedSeconds,
        activeRecord.mode,
        activeRecord.plannedSeconds,
      )
    ) {
      return;
    }

    if (handledGoalRecordId.current === activeRecord.id) {
      return;
    }

    handledGoalRecordId.current = activeRecord.id;
    playGoalSound(settings);
  }, [activeRecord, elapsedSeconds, settings]);

  const remainingSeconds = getRemainingSeconds(
    elapsedSeconds,
    activeRecord?.plannedSeconds ??
      (durationMinutes > 0 ? durationMinutes * 60 : null),
  );
  const isRunning =
    activeRecord !== null && activeRecord.segmentStartedAt !== null;
  const isPaused =
    activeRecord !== null && activeRecord.segmentStartedAt === null;
  const isIdle = activeRecord === null;
  const clockValue =
    mode === "timer"
      ? formatTimerClock(
          remainingSeconds ??
            (durationMinutes > 0 ? durationMinutes * 60 : 0),
        )
      : formatHmsClock(elapsedSeconds);
  const hasReachedGoal =
    mode === "stopwatch" &&
    remainingSeconds !== null &&
    remainingSeconds === 0 &&
    (activeRecord?.plannedSeconds ??
      (durationMinutes > 0 ? durationMinutes * 60 : 0)) > 0;
  const clockCaption = isIdle
    ? null
    : resolveClockCaption(
        mode,
        isRunning,
        isPaused,
        remainingSeconds,
        hasReachedGoal,
      );
  const hasSessionName = name.trim().length > 0;
  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );
  const isBacklogSelected = selectedSession !== undefined;

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
        setDurationMinutes(resolveDurationMinutes(nextSettings));
      }
      if (patch.defaultSaveNewSessions !== undefined && !isBacklogSelected) {
        setSaveToBacklog(nextSettings.defaultSaveNewSessions);
      }
    }
    return nextSettings;
  }

  function requestStop(recordedSeconds: number, confirmOnStop: boolean) {
    if (confirmOnStop) {
      setStopDialogCanSave(recordedSeconds > 0);
      setIsStopDialogOpen(true);
      return;
    }

    if (recordedSeconds > 0) {
      void handleSaveStop();
      return;
    }

    void handleDiscardStop();
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
    }
  }

  function handleDurationChange(minutes: number) {
    setDurationMinutes(minutes);
  }

  function handleDurationInputChange(value: string) {
    const parsed = parseMinutesInput(value);
    setDurationMinutes(parsed ?? 0);
  }

  async function handleStart() {
    setErrorMessage(null);
    setIsBusy(true);
    unlockTimerSound();
    try {
      await window.tempo.start({
        name,
        kind: isBacklogSelected ? "backlog" : "unknown",
        sessionId: selectedSessionId,
        saveToBacklog: !isBacklogSelected && saveToBacklog,
        mode,
        plannedSeconds: durationMinutes > 0 ? durationMinutes * 60 : null,
      });
      await refreshState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePlayBacklog(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId);
    if (session === undefined || !isIdle) {
      return;
    }

    handleSelectBacklog(sessionId);
    setErrorMessage(null);
    setIsBusy(true);
    unlockTimerSound();
    try {
      await window.tempo.start({
        name: session.name,
        kind: "backlog",
        sessionId,
        saveToBacklog: false,
        mode,
        plannedSeconds: durationMinutes > 0 ? durationMinutes * 60 : null,
      });
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to pause",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResume() {
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

  async function closeStopDialog(): Promise<void> {
    setIsStopDialogOpen(false);
    await refreshState();
  }

  async function handleSaveStop() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await window.tempo.stop();
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

  return (
    <>
      <GlobalStyle />
      <AppShell>
        <Sidebar $collapsed={settings.sidebarCollapsed}>
          <Brand $collapsed={settings.sidebarCollapsed}>
            <BrandMark
              ariaLabel={
                settings.sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              onClick={() => {
                void patchSettings({
                  sidebarCollapsed: !settings.sidebarCollapsed,
                });
              }}
            />
            {settings.sidebarCollapsed ? null : (
              <BrandCopy>
                <BrandName>Tempo</BrandName>
                <BrandVersion>v0.1.0</BrandVersion>
              </BrandCopy>
            )}
          </Brand>
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              type="button"
              title={settings.sidebarCollapsed ? item.label : undefined}
              $collapsed={settings.sidebarCollapsed}
              $active={activeScreen === item.id}
              onClick={() => setActiveScreen(item.id)}
            >
              <NavIcon screen={item.id} active={activeScreen === item.id} />
              <NavLabel $collapsed={settings.sidebarCollapsed}>
                {item.label}
              </NavLabel>
            </NavButton>
          ))}
        </Sidebar>
        <Main>
          {activeScreen === "focus" ? (
            <FocusScreen>
              <ModeToggle mode={mode} disabled={!isIdle} onChange={setMode} />
              <SetupGrid>
                <SetupFields>
                  <SessionNameField
                    name={name}
                    disabled={!isIdle || isBacklogSelected}
                    onChange={setName}
                  />
                  <Field>
                    <FieldLabel>
                      {mode === "timer" ? (
                        <>
                          Duration
                          <RequiredMark>*</RequiredMark>
                        </>
                      ) : (
                        "Goal (optional)"
                      )}
                    </FieldLabel>
                    <TextInput
                      value={
                        durationMinutes > 0 ? `${durationMinutes}m` : ""
                      }
                      disabled={!isIdle}
                      onChange={(event) =>
                        handleDurationInputChange(event.target.value)
                      }
                      placeholder={
                        mode === "timer" ? "e.g. 45m" : "e.g. 25m"
                      }
                    />
                  </Field>
                  {isIdle && !isBacklogSelected ? (
                    <SaveToBacklogField
                      visible
                      checked={saveToBacklog}
                      disabled={!isIdle}
                      onChange={setSaveToBacklog}
                    />
                  ) : null}
                  {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
                  {isIdle ? (
                    <Button
                      type="button"
                      $variant="glow"
                      disabled={isBusy || !hasSessionName}
                      onClick={handleStart}
                    >
                      <StartButtonContent>
                        Start
                        <StartPlayIcon aria-hidden>▶</StartPlayIcon>
                      </StartButtonContent>
                    </Button>
                  ) : (
                    <ButtonRow>
                      {isRunning ? (
                        <Button
                          type="button"
                          disabled={isBusy}
                          onClick={handlePause}
                        >
                          Pause
                        </Button>
                      ) : null}
                      {isPaused ? (
                        <Button
                          type="button"
                          disabled={isBusy}
                          onClick={handleResume}
                        >
                          Resume
                        </Button>
                      ) : null}
                      {activeRecord !== null ? (
                        <Button
                          type="button"
                          $variant="danger"
                          disabled={isBusy}
                          onClick={() => {
                            if (activeRecord !== null) {
                              handledAutoStopRecordId.current = activeRecord.id;
                            }
                            requestStop(elapsedSeconds, settings.confirmOnStop);
                          }}
                        >
                          Stop
                        </Button>
                      ) : null}
                    </ButtonRow>
                  )}
                </SetupFields>
                <DurationDial
                  minutes={durationMinutes}
                  displayValue={clockValue}
                  unitLabel={mode === "timer" ? "mins" : "secs"}
                  caption={clockCaption}
                  disabled={!isIdle}
                  onChange={handleDurationChange}
                />
              </SetupGrid>
              <CollapsibleSection title="Regular Sessions" defaultExpanded>
                <BacklogPicker
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  disabled={!isIdle}
                  onSelect={handleSelectBacklog}
                  onPlay={(sessionId) => {
                    void handlePlayBacklog(sessionId);
                  }}
                  onEdit={(session) => setEditingSession(session)}
                  onDelete={async (sessionId) => {
                    await window.tempo.deleteSession(sessionId);
                    if (selectedSessionId === sessionId) {
                      setSelectedSessionId(null);
                      setName("");
                    }
                    await refreshState();
                  }}
                />
              </CollapsibleSection>
            </FocusScreen>
          ) : null}
          {activeScreen === "history" ? (
            <>
              <MainHeader>
                <ScreenTitle>History</ScreenTitle>
                <Button
                  type="button"
                  $variant="ghost"
                  onClick={() => {
                    setEditingRecord(null);
                    setIsManualDialogOpen(true);
                  }}
                >
                  Add record
                </Button>
              </MainHeader>
              <HistorySection
                records={records}
                sessions={sessions}
                onEdit={(record) => {
                  setEditingRecord(record);
                  setIsManualDialogOpen(true);
                }}
                onDelete={async (recordId) => {
                  await window.tempo.deleteRecord(recordId);
                  await refreshState();
                }}
              />
            </>
          ) : null}
          {activeScreen === "analytics" ? (
            <>
              <MainHeader>
                <ScreenTitle>Analytics</ScreenTitle>
              </MainHeader>
              <AnalyticsSection records={records} sessions={sessions} />
            </>
          ) : null}
          {activeScreen === "settings" ? (
            <>
              <MainHeader>
                <ScreenTitle>Settings</ScreenTitle>
              </MainHeader>
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
            </>
          ) : null}
        </Main>
      </AppShell>
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
          canSave={stopDialogCanSave}
          isBusy={isBusy}
          onSave={() => {
            void handleSaveStop();
          }}
          onDiscard={() => {
            void handleDiscardStop();
          }}
        />
      ) : null}
    </>
  );
}

function BrandMark({ ariaLabel, onClick }: BrandMarkProps) {
  return (
    <BrandLogoButton type="button" aria-label={ariaLabel} onClick={onClick}>
      <BrandLogo viewBox="0 0 32 32" aria-hidden="true">
        <circle
          cx="16"
          cy="16"
          r="10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
        />
      </BrandLogo>
    </BrandLogoButton>
  );
}

interface BrandMarkProps {
  ariaLabel: string;
  onClick: () => void;
}

function SaveToBacklogField({
  visible,
  checked,
  disabled,
  onChange,
}: SaveToBacklogFieldProps) {
  return (
    <SaveFieldSlot>
      {visible ? (
        <CheckboxField>
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
          Save as Regular
        </CheckboxField>
      ) : null}
    </SaveFieldSlot>
  );
}

function SessionNameField({ name, disabled, onChange }: SessionNameFieldProps) {
  return (
    <Field>
      <FieldLabel>
        Session Name
        <RequiredMark>*</RequiredMark>
      </FieldLabel>
      <TextInput
        value={name}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Code Review - Project Alpha"
      />
    </Field>
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

function resolveClockCaption(
  mode: TimerMode,
  isRunning: boolean,
  isPaused: boolean,
  remainingSeconds: number | null,
  hasReachedGoal: boolean,
): string | null {
  if (isPaused) {
    return hasReachedGoal ? "Goal reached" : null;
  }

  if (mode === "timer") {
    if (remainingSeconds === null) {
      return "Set a duration to start";
    }
    return isRunning ? "Remaining" : "Ready";
  }

  return hasReachedGoal ? "Goal reached" : null;
}

const NAV_ITEMS: { id: AppScreen; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "history", label: "History" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

interface SaveToBacklogFieldProps {
  visible: boolean;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

interface SessionNameFieldProps {
  name: string;
  disabled: boolean;
  onChange: (name: string) => void;
}
