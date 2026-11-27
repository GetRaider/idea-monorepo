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
import { COUNTER_RECURRENCES, COUNTER_TARGET_MAX } from "@repo/api/todex";
import type { Counter, CounterRule } from "@repo/api/todex";

export function CounterFormDialog({
  counter,
  isPending,
  onSubmit,
  onClose,
}: CounterFormDialogProps) {
  // A pending change is what the user asked for last, so editing starts there.
  const initial = counter?.pendingChange ?? counter ?? DEFAULT_RULE;
  const [name, setName] = useState(counter?.name ?? "");
  const [recurrence, setRecurrence] = useState(recurrenceValue(initial));
  const [target, setTarget] = useState(String(initial.target));
  const [showInToday, setShowInToday] = useState(counter?.showInToday ?? true);
  const targetNumber = Number(target);
  const isValid =
    name.trim() !== "" &&
    Number.isInteger(targetNumber) &&
    targetNumber >= 1 &&
    targetNumber <= COUNTER_TARGET_MAX;

  function submit(event: FormEvent) {
    event.preventDefault();
    const rule = COUNTER_RECURRENCES.find(
      (item) => recurrenceValue(item) === recurrence,
    );
    if (!isValid || !rule) return;
    onSubmit({
      name: name.trim(),
      frequency: rule.frequency,
      interval: rule.interval,
      target: targetNumber,
      showInToday,
    });
  }

  return (
    <Dialog
      title={counter ? "Edit counter" : "New counter"}
      subtitle={
        counter
          ? "Recurrence and Target changes apply from the next period."
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="counter-recurrence">Recurrence</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger id="counter-recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[5000]">
                {COUNTER_RECURRENCES.map((item) => (
                  <SelectItem
                    key={recurrenceValue(item)}
                    value={recurrenceValue(item)}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="counter-target">Target per period</Label>
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
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          Show in Today
          <Switch
            checked={showInToday}
            onCheckedChange={setShowInToday}
            aria-label="Show in Today"
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

function recurrenceValue(rule: Pick<CounterRule, "frequency" | "interval">) {
  return `${rule.frequency}-${rule.interval}`;
}

const DEFAULT_RULE: CounterRule = {
  frequency: "weekly",
  interval: 1,
  target: 1,
};

export type CounterFormValues = CounterRule & {
  name: string;
  showInToday: boolean;
};

interface CounterFormDialogProps {
  counter?: Counter;
  isPending: boolean;
  onSubmit: (values: CounterFormValues) => void;
  onClose: () => void;
}
