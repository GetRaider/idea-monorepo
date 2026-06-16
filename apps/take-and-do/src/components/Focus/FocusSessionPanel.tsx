"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { toast } from "sonner";

import { PrimaryButton } from "@/components/Buttons";
import { DialogFormGroup, DialogFormLabel } from "@/components/Dialogs";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner/Spinner";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import {
  buildDefaultFocusSessionName,
  canEnableSaveToBacklog,
  formatFocusCountdown,
  getEstimationMinutes,
  hasValidEstimation,
} from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

import { FocusBacklogPicker } from "./FocusBacklogPicker";
import { FocusColourPicker } from "./FocusColourPicker";
import { FocusDurationDial } from "./FocusDurationDial";
import { FocusSectionHeader } from "./FocusSectionHeader";
import { FocusEstimationInput } from "./FocusEstimationInput";
import { FocusBreakSuggestionDialog, FocusStopDialog } from "./FocusStopDialog";
import { FocusTaskPicker } from "./FocusTaskPicker";

export function FocusSessionPanel() {
  const focus = useFocusSessionContext();

  if (!focus.isHydrated) {
    return <Spinner className="min-h-[280px] w-full" />;
  }

  return (
    <>
      <FocusSessionPanelBody focus={focus} />
      <FocusStopDialog />
      <FocusBreakSuggestionDialog />
    </>
  );
}

function FocusSessionPanelBody({
  focus,
}: {
  focus: ReturnType<typeof useFocusSessionContext>;
}) {
  const {
    systemState,
    activeTimer,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    stopFocusSession,
    stopBreakSession,
  } = focus;

  const handleStart = useCallback(() => {
    const result = startFocusSession();
    if (result.status !== "SUCCESS") {
      toast.error(result.reason ?? "Cannot start focus session");
    }
  }, [startFocusSession]);

  const isIdle = systemState === "idle";
  const isFocusTimer =
    systemState === "running" ||
    systemState === "paused" ||
    systemState === "stopping";
  const isBreakTimer =
    systemState === "break_running" || systemState === "break_stopping";

  if (isBreakTimer && activeTimer) {
    return (
      <FocusTimerCard
        title="Break"
        sessionName="Rest"
        remainingSeconds={activeTimer.remainingSeconds}
        statusLabel={systemState === "break_running" ? "Running" : "Stopping…"}
        primaryLabel="Stop"
        onPrimary={() => {
          const result = stopBreakSession();
          if (result.status !== "SUCCESS") {
            toast.error(result.reason ?? "Cannot stop break");
          }
        }}
      />
    );
  }

  if (isFocusTimer && activeTimer?.sessionType === "focus") {
    const statusLabel =
      systemState === "running"
        ? "Running"
        : systemState === "paused"
          ? "Paused"
          : "Stopping…";

    return (
      <FocusTimerCard
        title="Focus"
        sessionName={activeTimer.name}
        remainingSeconds={activeTimer.remainingSeconds}
        statusLabel={statusLabel}
        primaryLabel={systemState === "paused" ? "Resume" : "Pause"}
        secondaryLabel="Stop"
        onPrimary={() => {
          const result =
            systemState === "paused"
              ? resumeFocusSession()
              : pauseFocusSession();
          if (result.status !== "SUCCESS") {
            toast.error(result.reason ?? "Cannot update session");
          }
        }}
        onSecondary={() => {
          const result = stopFocusSession();
          if (result.status !== "SUCCESS") {
            toast.error(result.reason ?? "Cannot stop session");
          }
        }}
        primaryDisabled={systemState === "stopping"}
        secondaryDisabled={systemState === "stopping"}
      />
    );
  }

  if (!isIdle) {
    return null;
  }

  return <FocusIdleSessionPanel focus={focus} onStart={handleStart} />;
}

function FocusIdleSessionPanel({
  focus,
  onStart,
}: {
  focus: ReturnType<typeof useFocusSessionContext>;
  onStart: () => void;
}) {
  const {
    draft,
    idleDraft,
    sessions,
    backlog,
    configureSession,
    configureIdleDraft,
  } = focus;

  const dialMinutes = useMemo(() => {
    if (draft.durationMinutes === null) {
      return 0;
    }
    const estimation = getEstimationMinutes(draft);
    return estimation ?? 0;
  }, [draft]);

  const isNewSession = idleDraft.sessionSelection === "new";
  const canSaveBacklog = canEnableSaveToBacklog(draft, idleDraft);

  const canStart = useMemo(() => {
    if (!hasValidEstimation(draft)) return false;
    if (idleDraft.sessionSelection === "backlog") {
      return Boolean(idleDraft.selectedBacklogId);
    }
    if (!draft.taskId && draft.name.trim().length === 0) return false;
    return true;
  }, [draft, idleDraft.selectedBacklogId, idleDraft.sessionSelection]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <FocusSectionHeader title="Timer" />
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[auto_1px_minmax(0,1fr)] lg:items-stretch lg:gap-x-0">
          <section className="flex min-w-0 flex-col justify-center lg:pr-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
              <FocusDurationDial
                size="large"
                minutes={dialMinutes}
                onChange={(nextMinutes) =>
                  configureSession({ durationMinutes: nextMinutes })
                }
              />

              <div className="flex w-[14rem] shrink-0 flex-col gap-4">
                <FocusEstimationInput
                  size="large"
                  durationMinutes={draft.durationMinutes}
                  onChange={(minutes) =>
                    configureSession({ durationMinutes: minutes })
                  }
                />
                <PrimaryButton
                  type="button"
                  disabled={!canStart}
                  onClick={onStart}
                  className="w-full py-3 text-base"
                >
                  Start
                </PrimaryButton>
              </div>
            </div>
          </section>

          <div
            className="hidden w-px self-stretch bg-white/10 lg:block"
            aria-hidden
          />

          <section className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto overscroll-contain lg:max-h-[min(52vh,420px)] lg:pl-12">
            <FocusSessionDetailsContent
              draft={draft}
              idleDraft={idleDraft}
              isNewSession={isNewSession}
              canSaveBacklog={canSaveBacklog}
              configureSession={configureSession}
              configureIdleDraft={configureIdleDraft}
              onSelectNewSession={() => {
                configureIdleDraft({
                  sessionSelection: "new",
                  selectedBacklogId: null,
                });
                configureSession({
                  durationMinutes: null,
                  taskId: null,
                  name: buildDefaultFocusSessionName(sessions, backlog),
                });
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function FocusSessionDetailsContent({
  draft,
  idleDraft,
  isNewSession,
  canSaveBacklog,
  configureSession,
  configureIdleDraft,
  onSelectNewSession,
}: FocusSessionDetailsContentProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-xs font-medium text-text-secondary">
          Session selection
        </p>
        <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5">
          <FocusModeToggleButton
            active={isNewSession}
            onClick={onSelectNewSession}
          >
            New
          </FocusModeToggleButton>
          <FocusModeToggleButton
            active={!isNewSession}
            onClick={() => configureIdleDraft({ sessionSelection: "backlog" })}
          >
            Backlog
          </FocusModeToggleButton>
        </div>
      </div>

      {isNewSession ? (
        <>
          <DialogFormGroup className="mb-0 gap-1.5">
            <DialogFormLabel htmlFor="focus-session-name">Name</DialogFormLabel>
            <Input
              id="focus-session-name"
              value={draft.name}
              readOnly={Boolean(draft.taskId)}
              placeholder={
                draft.taskId ? "Linked task title" : "Required without a task"
              }
              onChange={(event) =>
                configureSession({ name: event.target.value })
              }
            />
          </DialogFormGroup>

          <FocusColourPicker
            value={idleDraft.color}
            onChange={(color) => configureIdleDraft({ color })}
            defaultExpanded={false}
          />

          <FocusTaskPicker compact defaultExpanded={false} />

          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-xs font-medium text-text-secondary">
              Save to backlog?
            </p>
            <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5">
              <FocusModeToggleButton
                active={idleDraft.saveToBacklog}
                disabled={!canSaveBacklog}
                onClick={() => configureIdleDraft({ saveToBacklog: true })}
              >
                Yes
              </FocusModeToggleButton>
              <FocusModeToggleButton
                active={!idleDraft.saveToBacklog}
                onClick={() => configureIdleDraft({ saveToBacklog: false })}
              >
                No
              </FocusModeToggleButton>
            </div>
            {!canSaveBacklog ? (
              <p className="m-0 text-[11px] text-text-tertiary">
                Linked tasks cannot be saved to the backlog.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <FocusBacklogPicker />
      )}
    </>
  );
}

function FocusModeToggleButton({
  active,
  disabled = false,
  onClick,
  children,
}: FocusModeToggleButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-white text-black"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      {children}
    </button>
  );
}

function FocusTimerCard({
  title,
  sessionName,
  remainingSeconds,
  statusLabel,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false,
}: FocusTimerCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <FocusSectionHeader title="Timer" />
      <div className="flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-6 border-t border-white/10 px-6 py-8 sm:px-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="m-0 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {title}
          </p>
          <p className="m-0 max-w-full truncate text-base font-semibold text-text-primary">
            {sessionName}
          </p>
          <p className="m-0 text-xs text-text-secondary">{statusLabel}</p>
        </div>

        <p className="m-0 font-mono text-5xl font-semibold tabular-nums tracking-tight text-text-primary sm:text-6xl">
          {formatFocusCountdown(remainingSeconds)}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {secondaryLabel && onSecondary ? (
            <PrimaryButton
              type="button"
              size="sm"
              variant="surface"
              disabled={secondaryDisabled}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </PrimaryButton>
          ) : null}
          <PrimaryButton
            type="button"
            size="sm"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

interface FocusSessionDetailsContentProps {
  draft: ReturnType<typeof useFocusSessionContext>["draft"];
  idleDraft: ReturnType<typeof useFocusSessionContext>["idleDraft"];
  isNewSession: boolean;
  canSaveBacklog: boolean;
  configureSession: ReturnType<
    typeof useFocusSessionContext
  >["configureSession"];
  configureIdleDraft: ReturnType<
    typeof useFocusSessionContext
  >["configureIdleDraft"];
  onSelectNewSession: () => void;
}

interface FocusModeToggleButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

interface FocusTimerCardProps {
  title: string;
  sessionName: string;
  remainingSeconds: number;
  statusLabel: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
}
