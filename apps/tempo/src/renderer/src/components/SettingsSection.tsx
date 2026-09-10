import { cn } from "../lib/cn";

import type {
  AppSettings,
  DurationPreset,
  MenuBarClockStyle,
} from "../../../shared/settings.types";
import type { TimerMode } from "../../../shared/records.types";

export function SettingsSection({
  settings,
  onChange,
  onImport,
}: SettingsSectionProps) {
  return (
    <form className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-8 py-6">
      <h1 className="m-0 text-xl font-medium">Settings</h1>
      <SettingsGroup title="Defaults">
        <Field label="Default mode">
          <Select
            value={settings.defaultMode}
            onChange={(event) =>
              onChange({ defaultMode: event.target.value as TimerMode })
            }
          >
            <option value="stopwatch">Stopwatch</option>
            <option value="timer">Timer</option>
          </Select>
        </Field>
        <Field label="Default duration">
          <Select
            value={settings.durationPreset}
            onChange={(event) =>
              onChange({ durationPreset: event.target.value as DurationPreset })
            }
          >
            <option value="last">Last used</option>
            <option value="25">25 minutes</option>
            <option value="50">50 minutes</option>
          </Select>
        </Field>
        <Checkbox
          checked={settings.defaultSaveNewSessions}
          onChange={(checked) => onChange({ defaultSaveNewSessions: checked })}
        >
          Save new names as activities
        </Checkbox>
        <Checkbox
          checked={settings.confirmOnStop}
          onChange={(checked) => onChange({ confirmOnStop: checked })}
        >
          Confirm before saving or discarding
        </Checkbox>
      </SettingsGroup>
      <SettingsGroup title="Sound">
        <Checkbox
          checked={settings.soundEnabled}
          onChange={(checked) => onChange({ soundEnabled: checked })}
        >
          Play timer and goal sounds
        </Checkbox>
        <label className="flex flex-col gap-1 text-sm text-tempo-muted">
          Volume ({Math.round(settings.soundVolume * 100)}%)
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            disabled={!settings.soundEnabled}
            onChange={(event) =>
              onChange({ soundVolume: Number(event.target.value) })
            }
          />
        </label>
      </SettingsGroup>
      <SettingsGroup title="Break">
        <Checkbox
          checked={settings.offerBreakTimer}
          onChange={(checked) => onChange({ offerBreakTimer: checked })}
        >
          Offer break timer on pause and after saving
        </Checkbox>
        <Field label="Default break duration (minutes)">
          <input
            type="number"
            min={1}
            max={60}
            className={inputClassName}
            value={settings.breakDurationMinutes}
            onChange={(event) =>
              onChange({
                breakDurationMinutes: Number(event.target.value),
              })
            }
          />
        </Field>
      </SettingsGroup>
      <SettingsGroup title="Window">
        <Checkbox
          checked={settings.alwaysOnTop}
          onChange={(checked) => onChange({ alwaysOnTop: checked })}
        >
          Always on top
        </Checkbox>
        <Checkbox
          checked={settings.menuBarClockVisible}
          onChange={(checked) => onChange({ menuBarClockVisible: checked })}
        >
          Show clock in the menu bar
        </Checkbox>
        <Field label="Menu bar clock">
          <Select
            value={settings.menuBarClockStyle}
            disabled={!settings.menuBarClockVisible}
            onChange={(event) =>
              onChange({
                menuBarClockStyle: event.target.value as MenuBarClockStyle,
              })
            }
          >
            <option value="auto">
              Auto (timer remaining / stopwatch elapsed)
            </option>
            <option value="elapsed">Always elapsed</option>
            <option value="remaining">Remaining when a duration is set</option>
          </Select>
        </Field>
      </SettingsGroup>
      <SettingsGroup title="Data">
        <p className="m-0 text-sm text-tempo-muted">
          Sessions and records are stored locally in SQLite on this Mac. No
          account, no cloud.
        </p>
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={() => void window.tempo.revealData()}>
            Reveal in Finder
          </GhostButton>
          <GhostButton onClick={() => void window.tempo.exportData()}>
            Export
          </GhostButton>
          <GhostButton
            onClick={() => {
              const confirmed = window.confirm(
                "Import replaces sessions and records on this Mac",
              );
              if (confirmed) {
                void onImport();
              }
            }}
          >
            Import
          </GhostButton>
        </div>
      </SettingsGroup>
    </form>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex max-w-xl flex-col gap-3">
      <h2 className="m-0 text-xs font-medium uppercase tracking-wide text-tempo-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-tempo-muted">
      {label}
      {children}
    </label>
  );
}

function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClassName, className)} {...props} />;
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-tempo-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-xl border border-tempo-line bg-transparent px-3 py-2 text-sm text-tempo-muted hover:text-tempo-text"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const inputClassName =
  "rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-tempo-text";

interface SettingsSectionProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onImport: () => Promise<void>;
}
