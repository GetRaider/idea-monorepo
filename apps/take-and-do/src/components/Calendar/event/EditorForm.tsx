"use client";

import type { Dispatch, SetStateAction } from "react";

import {
  DialogActions,
  DialogBody,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import type {
  CalendarEventType,
  CalendarRepeatValue,
  CalendarTimeZone,
} from "@/types/calendar.types";

import { CalendarColorPickerPopover } from "../shared/ColorPickerPopover";
import { CalendarEventTaskScopeSection } from "../shared/TaskScopeSection";
import { CalendarEventTaskSection } from "../shared/TaskSection";
import { kindLabel } from "@/helpers/calendar/calendar-event-mapper";
import type {
  CalendarEventEditorDraft,
  CommonCreateDestination,
} from "./editorDraft";
import { timeZoneOptions } from "../shared/timezones";

export interface EditorFormProps {
  draft: CalendarEventEditorDraft;
  setDraft: Dispatch<SetStateAction<CalendarEventEditorDraft>>;
  isGuest: boolean;
  editorFillPreview: string;
  showCommonDestination: boolean;
  commonDestinationLocked: boolean;
  commonDestinationDisplay: CommonCreateDestination;
  setCommonCreateDestination: (next: CommonCreateDestination) => void;
  inputClass: string;
  onCancel: () => void;
  onSave: () => void;
}

export function EditorForm({
  draft,
  setDraft,
  isGuest,
  editorFillPreview,
  showCommonDestination,
  commonDestinationLocked,
  commonDestinationDisplay,
  setCommonCreateDestination,
  inputClass,
  onCancel,
  onSave,
}: EditorFormProps) {
  return (
    <>
      <DialogBody className="gap-4">
        <DialogFormGroup>
          <DialogFormLabel>Title</DialogFormLabel>
          <div className="flex min-w-0 items-center gap-2">
            <Input
              className="min-w-0 flex-1 rounded-lg"
              value={draft.title}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, title: ev.target.value }))
              }
              placeholder="e.g. Gym Training, Team retro"
              maxLength={200}
            />
            <CalendarColorPickerPopover
              selectedHex={editorFillPreview}
              onSelect={(hex) => setDraft((d) => ({ ...d, colorHex: hex }))}
              onResetToDefault={() => setDraft((d) => ({ ...d, colorHex: "" }))}
              trigger={
                <span
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.18] shadow-inner"
                  style={{ backgroundColor: editorFillPreview }}
                  aria-label="Event color"
                />
              }
            />
          </div>
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Type</DialogFormLabel>
          <Dropdown<CalendarEventType>
            options={[
              { value: "timeBlock", label: kindLabel("timeBlock") },
              { value: "common", label: kindLabel("common") },
              { value: "task", label: kindLabel("task") },
            ]}
            value={draft.type}
            onChange={(type) => {
              if (type !== "common") setCommonCreateDestination("internal");
              setDraft((d) => ({ ...d, type }));
            }}
            fullWidth
          />
        </DialogFormGroup>

        {showCommonDestination ? (
          <DialogFormGroup>
            <DialogFormLabel>Destination</DialogFormLabel>
            <Dropdown<CommonCreateDestination>
              options={[
                {
                  value: "internal",
                  label: "Internal (Only this calendar)",
                },
                { value: "google", label: "Google Calendar" },
              ]}
              value={commonDestinationDisplay}
              onChange={setCommonCreateDestination}
              disabled={commonDestinationLocked}
              fullWidth
            />
          </DialogFormGroup>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DialogFormGroup>
            <DialogFormLabel>Start</DialogFormLabel>
            <input
              type={draft.allDay ? "date" : "datetime-local"}
              className={inputClass}
              value={draft.allDay ? draft.start.slice(0, 10) : draft.start}
              onChange={(ev) => {
                const v = ev.target.value;
                setDraft((d) =>
                  d.allDay
                    ? { ...d, start: `${v}T00:00`, end: `${v}T23:59` }
                    : { ...d, start: v },
                );
              }}
            />
          </DialogFormGroup>
          <DialogFormGroup>
            <DialogFormLabel>End</DialogFormLabel>
            <input
              type={draft.allDay ? "date" : "datetime-local"}
              className={inputClass}
              value={draft.allDay ? draft.end.slice(0, 10) : draft.end}
              onChange={(ev) => {
                const v = ev.target.value;
                setDraft((d) =>
                  d.allDay ? { ...d, end: `${v}T23:59` } : { ...d, end: v },
                );
              }}
            />
          </DialogFormGroup>
        </div>

        <DialogFormGroup>
          <DialogFormLabel>Description</DialogFormLabel>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={draft.descriptionText}
            onChange={(ev) =>
              setDraft((d) => ({ ...d, descriptionText: ev.target.value }))
            }
            placeholder="Feel free to mention task or docs by @"
          />
        </DialogFormGroup>

        <details className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <summary className="cursor-pointer select-none text-sm font-medium text-zinc-200">
            Details
          </summary>

          <div className="mt-3 flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={draft.allDay}
                onChange={(ev) =>
                  setDraft((d) => ({ ...d, allDay: ev.target.checked }))
                }
                className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg accent-zinc-200"
              />
              All-day
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DialogFormGroup>
                <DialogFormLabel>Time zone</DialogFormLabel>
                <Dropdown<CalendarTimeZone>
                  options={timeZoneOptions()}
                  value={draft.timeZone}
                  onChange={(timeZone) => setDraft((d) => ({ ...d, timeZone }))}
                  fullWidth
                />
              </DialogFormGroup>
              <DialogFormGroup>
                <DialogFormLabel>Repeat</DialogFormLabel>
                <Dropdown<CalendarRepeatValue>
                  options={[
                    { value: "", label: "Does not repeat" },
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                  ]}
                  value={draft.repeat}
                  onChange={(repeat) => setDraft((d) => ({ ...d, repeat }))}
                  fullWidth
                />
              </DialogFormGroup>
            </div>

            <DialogFormGroup>
              <DialogFormLabel>Reminder</DialogFormLabel>
              <Dropdown<string>
                options={[
                  { value: "", label: "None" },
                  { value: "5", label: "5 min before" },
                  { value: "10", label: "10 min before" },
                  { value: "30", label: "30 min before" },
                  { value: "60", label: "1 hour before" },
                ]}
                value={draft.reminderMinutes}
                onChange={(reminderMinutes) =>
                  setDraft((d) => ({ ...d, reminderMinutes }))
                }
                fullWidth
              />
            </DialogFormGroup>

            {draft.type !== "task" ? (
              <>
                <DialogFormGroup>
                  <DialogFormLabel>Participants</DialogFormLabel>
                  <Input
                    value={draft.participantsText}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        participantsText: e.target.value,
                      }))
                    }
                    placeholder="Add participants (comma-separated)"
                    maxLength={128}
                  />
                </DialogFormGroup>

                <DialogFormGroup>
                  <DialogFormLabel>Meeting URL</DialogFormLabel>
                  <Input
                    value={draft.meetingUrlText}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        meetingUrlText: e.target.value,
                      }))
                    }
                    placeholder="Add meeting link"
                    maxLength={256}
                  />
                </DialogFormGroup>

                <DialogFormGroup>
                  <DialogFormLabel>Notes</DialogFormLabel>
                  <Input
                    value={draft.notesText}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, notesText: e.target.value }))
                    }
                    placeholder="Add a note"
                    maxLength={256}
                  />
                </DialogFormGroup>
              </>
            ) : null}

            {draft.type === "timeBlock" ? (
              <CalendarEventTaskScopeSection
                value={draft.taskScope}
                onChange={(next) =>
                  setDraft((d) => ({ ...d, taskScope: next }))
                }
                disabled={isGuest}
              />
            ) : null}

            {draft.type === "task" ? (
              <CalendarEventTaskSection
                taskBoardId={draft.taskBoardId}
                taskId={draft.taskId}
                isGuest={isGuest}
                inputClass={inputClass}
                onBoardChange={(boardId) =>
                  setDraft((d) => ({
                    ...d,
                    taskBoardId: boardId,
                    taskId: "",
                    taskSummarySnapshot: "",
                  }))
                }
                onTaskChange={(tid, snap) =>
                  setDraft((d) => ({
                    ...d,
                    taskId: tid,
                    taskSummarySnapshot: snap,
                  }))
                }
                onTitleSync={(summary) =>
                  setDraft((d) =>
                    !d.title.trim() ? { ...d, title: summary } : d,
                  )
                }
              />
            ) : null}
          </div>
        </details>

        {/* attendeesNote removed */}
      </DialogBody>

      <DialogActions className="flex flex-wrap justify-end gap-3">
        <DialogFormButton type="button" onClick={onCancel}>
          Cancel
        </DialogFormButton>
        <DialogFormButton type="button" primary onClick={onSave}>
          Save
        </DialogFormButton>
      </DialogActions>
    </>
  );
}
