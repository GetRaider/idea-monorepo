import { cn } from "../lib/cn";

import { ActivityPills } from "../components/ActivityPills";
import { ClockDisplay } from "../components/ClockDisplay";
import { DurationChips } from "../components/DurationChips";
import { ModeToggle } from "../components/ModeToggle";
import { ProgressRail } from "../components/ProgressRail";
import { Button } from "../components/ui/button";

import type { FocusViewState } from "../../../helpers/focus-view.helper";
import type { SavedSession, TimerMode } from "../../../shared/records.types";

export function FocusStage({
  viewState,
  mode,
  name,
  scope,
  durationMinutes,
  sessions,
  selectedSessionId,
  saveToBacklog,
  isBacklogSelected,
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
  startHint,
  errorMessage,
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
    viewState !== "breakOnly" &&
    viewState !== "focusPausedBreakRunning" &&
    !isBreakSelected;
  const showComposer = isIdle;
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
          <ModeToggle mode={mode} disabled={!isIdle} onChange={onModeChange} />
        ) : null}
        <input
          className="z-[1] w-[min(420px,80vw)] rounded-lg border-0 bg-transparent px-3 py-1.5 text-center text-lg font-medium text-tempo-text placeholder:text-tempo-faint focus:bg-tempo-panel"
          value={name}
          disabled={!isIdle || isBacklogSelected}
          spellCheck={false}
          placeholder="Untitled session"
          onChange={(event) => onNameChange(event.target.value)}
        />
        <ClockDisplay value={clockValue} overGoal={overGoal} />
        <ProgressRail
          elapsedSeconds={elapsedSeconds}
          targetSeconds={targetSeconds}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          done={railDone}
        />
        <div className="z-[1] mt-1 flex gap-2.5">
          {isIdle ? (
            <Button disabled={isBusy || !canStart} onClick={onStart}>
              Start
            </Button>
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
        {isIdle && !canStart ? (
          <p className="z-[1] m-0 text-xs text-tempo-muted">{startHint}</p>
        ) : null}
        {errorMessage ? (
          <p className="z-[1] m-0 text-xs text-tempo-danger">{errorMessage}</p>
        ) : null}
        {showComposer ? (
          <>
            <DurationChips
              mode={mode}
              durationMinutes={durationMinutes}
              disabled={!isIdle}
              onChange={onDurationChange}
            />
            <textarea
              className="z-[1] w-[min(440px,86vw)] resize-none rounded-[11px] border border-tempo-line bg-tempo-panel px-3.5 py-3 text-sm text-tempo-text placeholder:text-tempo-faint focus:border-tempo-line-2"
              value={scope}
              disabled={!isIdle}
              rows={2}
              placeholder="What you'll work on this session"
              onChange={(event) => onScopeChange(event.target.value)}
            />
            {!isBacklogSelected ? (
              <label className="z-[1] flex items-center gap-2 text-sm text-tempo-muted">
                <input
                  type="checkbox"
                  checked={saveToBacklog}
                  disabled={!isIdle}
                  onChange={(event) =>
                    onSaveToBacklogChange(event.target.checked)
                  }
                />
                Save as activity
              </label>
            ) : null}
          </>
        ) : null}
      </main>
      <footer className="flex flex-wrap items-center gap-[18px] border-t border-tempo-line bg-[rgba(8,9,12,0.5)] px-8 py-[18px] backdrop-blur-[14px]">
        <span className="text-xs font-medium text-tempo-faint">My Activities</span>
        <ActivityPills
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          breakDurationMinutes={breakDurationMinutes}
          disabled={!isIdle}
          onSelect={onSelectActivity}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
        />
      </footer>
    </div>
  );
}

interface FocusStageProps {
  viewState: FocusViewState;
  mode: TimerMode;
  name: string;
  scope: string;
  durationMinutes: number;
  sessions: SavedSession[];
  selectedSessionId: string | null;
  saveToBacklog: boolean;
  isBacklogSelected: boolean;
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
  startHint: string;
  errorMessage: string | null;
  pausedFocusLabel: string | null;
  isLive: boolean;
  onModeChange: (mode: TimerMode) => void;
  onNameChange: (name: string) => void;
  onScopeChange: (scope: string) => void;
  onDurationChange: (minutes: number) => void;
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
