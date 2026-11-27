"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@repo/ui";
import { COUNTER_TARGET_MAX, DEFAULT_SPACE_COLOR } from "@repo/api/todex";
import type { Counter, CounterRule, SpaceColor } from "@repo/api/todex";

import { SpaceColorPicker } from "@components/space-color-picker";

import {
  localToday,
  scheduleDraft,
  scheduleFromDraft,
} from "./counter-helpers";
import { NO_SECTION_ID } from "./counter-helpers";
import { ScheduleFields } from "./schedule-fields";
import { useCounterSections } from "./use-counters";

export function CounterFormDialog({
  counter,
  defaultSectionId,
  isPending,
  onSubmit,
  onClose,
}: CounterFormDialogProps) {
  // A pending change is what the user asked for last, so editing starts there.
  const initial = counter?.pendingChange ?? counter ?? DEFAULT_RULE;
  const [name, setName] = useState(counter?.name ?? "");
  const [draft, setDraft] = useState(() =>
    scheduleDraft(initial.schedule, localToday()),
  );
  const [target, setTarget] = useState(String(initial.target));
  const [showInToday, setShowInToday] = useState(counter?.showInToday ?? true);
  const { data: sections = [] } = useCounterSections();
  const [sectionId, setSectionId] = useState(
    counter?.sectionId ?? defaultSectionId ?? NO_SECTION_ID,
  );
  const [color, setColor] = useState<SpaceColor>(
    counter?.color ?? DEFAULT_SPACE_COLOR,
  );
  const schedule = scheduleFromDraft(draft);
  const targetNumber = Number(target);
  const isValid =
    name.trim() !== "" &&
    schedule !== null &&
    Number.isInteger(targetNumber) &&
    targetNumber >= 1 &&
    targetNumber <= COUNTER_TARGET_MAX;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValid || !schedule) return;
    onSubmit({
      name: name.trim(),
      schedule,
      target: targetNumber,
      showInToday,
      sectionId: sectionId === NO_SECTION_ID ? null : sectionId,
      color,
    });
  }

  return (
    <Dialog
      title={counter ? "Edit counter" : "New counter"}
      subtitle={
        counter
          ? "If today is scheduled, repeat and goal changes start tomorrow."
          : undefined
      }
      onClose={onClose}
      // The dialog focuses its first control, which should be the name.
      showCloseButton={false}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="counter-name">Name</Label>
          <Input
            id="counter-name"
            autoFocus
            maxLength={200}
            placeholder="Gym"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <ScheduleFields draft={draft} onChange={setDraft} />
        <div className="space-y-2">
          <Label htmlFor="counter-target">Times per day</Label>
          <Input
            id="counter-target"
            type="number"
            inputMode="numeric"
            min={1}
            max={COUNTER_TARGET_MAX}
            step={1}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="counter-section">Section</Label>
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger id="counter-section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[5000]">
              <SelectItem value={NO_SECTION_ID}>No section</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Color</p>
          <SpaceColorPicker value={color} onChange={setColor} />
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          Show in Today/Tomorrow
          <Switch
            checked={showInToday}
            onCheckedChange={setShowInToday}
            aria-label="Show in Today/Tomorrow"
          />
        </label>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !isValid}>
            {counter ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

const DEFAULT_RULE: CounterRule = {
  schedule: { frequency: "daily", interval: 1 },
  target: 1,
};

export type CounterFormValues = CounterRule & {
  name: string;
  showInToday: boolean;
  sectionId: string | null;
  color: SpaceColor;
};

interface CounterFormDialogProps {
  counter?: Counter;
  /** The section a new Counter starts in. */
  defaultSectionId?: string | null;
  isPending: boolean;
  onSubmit: (values: CounterFormValues) => void;
  onClose: () => void;
}
