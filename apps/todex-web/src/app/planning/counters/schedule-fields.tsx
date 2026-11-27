"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import { COUNTER_DAY_INTERVAL_MAX, COUNTER_WEEKDAYS } from "@repo/api/todex";
import type { TaskWeekday } from "@repo/api/todex";

import type { ScheduleDraft } from "./counter-helpers";

/** The repeat kind and the one or two settings that kind needs. */
export function ScheduleFields({
  draft,
  onChange,
}: {
  draft: ScheduleDraft;
  onChange: (draft: ScheduleDraft) => void;
}) {
  function toggleWeekday(weekday: TaskWeekday) {
    const weekdays = draft.weekdays.includes(weekday)
      ? draft.weekdays.filter((selected) => selected !== weekday)
      : [...draft.weekdays, weekday];
    onChange({ ...draft, weekdays });
  }

  function selectKind(value: string) {
    const kind = REPEAT_KINDS.find((item) => item.value === value);
    if (kind) onChange({ ...draft, frequency: kind.value });
  }

  return (
    <fieldset className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="counter-repeat">Repeat</Label>
          <Select value={draft.frequency} onValueChange={selectKind}>
            <SelectTrigger id="counter-repeat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[5000]">
              {REPEAT_KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {draft.frequency === "daily" ? (
          <div className="space-y-2">
            <Label htmlFor="counter-day-interval">Every N days</Label>
            <Input
              id="counter-day-interval"
              type="number"
              inputMode="numeric"
              min={1}
              max={COUNTER_DAY_INTERVAL_MAX}
              step={1}
              value={draft.dayInterval}
              onChange={(event) =>
                onChange({ ...draft, dayInterval: event.target.value })
              }
            />
          </div>
        ) : null}
        {draft.frequency === "weekly" ? (
          <div className="space-y-2">
            <Label htmlFor="counter-week-interval">Weeks</Label>
            <Select
              value={String(draft.weekInterval)}
              onValueChange={(value) =>
                onChange({ ...draft, weekInterval: Number(value) })
              }
            >
              <SelectTrigger id="counter-week-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[5000]">
                <SelectItem value="1">Every week</SelectItem>
                <SelectItem value="2">Every 2 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {draft.frequency === "monthly" ? (
          <div className="space-y-2">
            <Label htmlFor="counter-month-day">Day of month</Label>
            <Input
              id="counter-month-day"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              step={1}
              value={draft.monthDay}
              onChange={(event) =>
                onChange({ ...draft, monthDay: event.target.value })
              }
            />
          </div>
        ) : null}
      </div>
      {draft.frequency === "weekly" ? (
        <div
          role="group"
          aria-label="Days of the week"
          className="grid grid-cols-7 gap-1"
        >
          {COUNTER_WEEKDAYS.map((day) => {
            const selected = draft.weekdays.includes(day.code);
            return (
              <button
                key={day.code}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "h-9 rounded-md border text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-foreground bg-foreground font-semibold text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                onClick={() => toggleWeekday(day.code)}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {draft.frequency === "monthly" ? (
        <p className="text-xs text-muted-foreground">
          Shorter months use their last day.
        </p>
      ) : null}
    </fieldset>
  );
}

const REPEAT_KINDS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Days of the week" },
  { value: "monthly", label: "Monthly" },
] as const;
