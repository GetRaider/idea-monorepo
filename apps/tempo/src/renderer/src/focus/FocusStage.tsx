import { ClockDisplay } from "../components/ClockDisplay";
import { DurationChips } from "../components/DurationChips";
import { ModeToggle } from "../components/ModeToggle";
import { ProgressRail } from "../components/ProgressRail";
import { ScopeComposer } from "../components/ScopeComposer";
import { SessionCombobox } from "../components/SessionCombobox";
import { Button } from "../components/ui/button";
import { cn } from "../lib/cn";

import type { FocusViewState } from "../../../helpers/focus-view.helper";
import type { SavedSession, TimerMode } from "../../../shared/records.types";

export function FocusStage({
  viewState,
  mode,
  name,
  scope,
  durationSeconds,
  sessions,
  selectedSessionId,
  saveToBacklog,
  isBreakSelected,
  breakDurationMinutes,
  clockValue,
  overGoal,
  elapsedSeconds,
  targetSeconds,
  leftLabel,
  rightLabel,
  railDone,
  isBusy,
  canStart,
  errorMessage,
  activityErrorMessage,
  pausedFocusLabel,
  isLive,
  onModeChange,
  onNameChange,
  onScopeChange,
  onDurationChange,
  onSaveToBacklogChange,
  onSelectActivity,
  onEditActivity,
  onDeleteActivity,
  onStart,
  onPause,
  onResume,
  onStop,
  onStopBreak,
}: FocusStageProps) {
  const isIdle = viewState === "idle";
  const showModeToggle =
    viewState !== "breakOnly" && viewState !== "focusPausedBreakRunning";
  const showStop = viewState === "focusRunning" || viewState === "focusPaused";
  const showStopBreak =
    viewState === "breakOnly" || viewState === "focusPausedBreakRunning";
  const showPause = viewState === "focusRunning";
  const showResume =
    viewState === "focusPaused" || viewState === "focusPausedBreakRunning";
  const resumeBlocked = viewState === "focusPausedBreakRunning";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="relative flex flex-1 flex-col items-center justify-center gap-[22px] px-6 py-10">
        <div
          className={cn("tempo-glow", isLive ? "opacity-90" : "opacity-50")}
        />
        {showModeToggle ? (
          <ModeToggle
            mode={isBreakSelected ? "timer" : mode}
            disabled={!isIdle || isBreakSelected}
            onChange={onModeChange}
          />
        ) : null}
        <SessionCombobox
          name={name}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          saveToBacklog={saveToBacklog}
          disabled={!isIdle}
          breakDurationMinutes={breakDurationMinutes}
          errorMessage={activityErrorMessage}
          onNameChange={onNameChange}
          onSelectActivity={onSelectActivity}
          onSaveToBacklogChange={onSaveToBacklogChange}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
        />
        <ClockDisplay value={clockValue} overGoal={overGoal} />
        {isIdle ? null : (
          <ProgressRail
            elapsedSeconds={elapsedSeconds}
            targetSeconds={targetSeconds}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            done={railDone}
          />
        )}
        <div className="z-[1] mt-1 flex gap-2.5">
          {isIdle ? (
            <IdleStartButton
              disabled={isBusy || !canStart}
              showHint={!canStart && name.trim().length === 0}
              onClick={onStart}
            />
          ) : null}
          {showPause ? (
            <Button disabled={isBusy} onClick={onPause}>
              Pause
            </Button>
          ) : null}
          {showResume ? (
            <Button disabled={isBusy || resumeBlocked} onClick={onResume}>
              Resume
            </Button>
          ) : null}
          {showStop ? (
            <Button variant="secondary" disabled={isBusy} onClick={onStop}>
              Stop
            </Button>
          ) : null}
          {showStopBreak ? (
            <Button variant="danger" disabled={isBusy} onClick={onStopBreak}>
              Stop break
            </Button>
          ) : null}
        </div>
        {resumeBlocked ? (
          <p className="z-[1] m-0 text-xs text-tempo-muted">
            Finish break to resume
          </p>
        ) : null}
        {pausedFocusLabel ? (
          <p className="z-[1] m-0 text-xs text-tempo-muted">{pausedFocusLabel}</p>
        ) : null}
        {errorMessage ? (
          <p className="z-[1] m-0 text-xs text-tempo-danger">{errorMessage}</p>
        ) : null}
        <DurationChips
          durationSeconds={durationSeconds}
          disabled={!isIdle}
          onChange={onDurationChange}
        />
        <ScopeComposer
          value={scope}
          disabled={!isIdle}
          onChange={onScopeChange}
        />
      </main>
    </div>
  );
}

function IdleStartButton({
  disabled,
  showHint,
  onClick,
}: IdleStartButtonProps) {
  return (
    <span className="group relative z-[1] inline-flex">
      <Button disabled={disabled} onClick={onClick}>
        Start
      </Button>
      {showHint ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-tempo-line bg-tempo-panel px-2.5 py-1.5 text-xs text-tempo-muted opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
        >
          Select or Create an Activity
        </span>
      ) : null}
    </span>
  );
}

interface FocusStageProps {
  viewState: FocusViewState;
  mode: TimerMode;
  name: string;
  scope: string;
  durationSeconds: number;
  sessions: SavedSession[];
  selectedSessionId: string | null;
  saveToBacklog: boolean;
  isBreakSelected: boolean;
  breakDurationMinutes: number;
  clockValue: string;
  overGoal: boolean;
  elapsedSeconds: number;
  targetSeconds: number;
  leftLabel: string;
  rightLabel: string;
  railDone: boolean;
  isBusy: boolean;
  canStart: boolean;
  errorMessage: string | null;
  activityErrorMessage: string | null;
  pausedFocusLabel: string | null;
  isLive: boolean;
  onModeChange: (mode: TimerMode) => void;
  onNameChange: (name: string) => void;
  onScopeChange: (scope: string) => void;
  onDurationChange: (seconds: number) => void;
  onSaveToBacklogChange: (checked: boolean) => void;
  onSelectActivity: (sessionId: string | null) => void;
  onEditActivity: (session: SavedSession) => void;
  onDeleteActivity: (sessionId: string) => Promise<void>;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStopBreak: () => void;
}

interface IdleStartButtonProps {
  disabled: boolean;
  showHint: boolean;
  onClick: () => void;
}
