import { Checkbox } from "./ui/checkbox";
import { SelectMenu } from "./ui/dropdown-menu";

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
          <SelectMenu
            value={settings.defaultMode}
            options={[
              { value: "stopwatch", label: "Stopwatch" },
              { value: "timer", label: "Timer" },
            ]}
            onValueChange={(value) =>
              onChange({ defaultMode: value as TimerMode })
            }
          />
        </Field>
        <Field label="Default duration">
          <SelectMenu
            value={settings.durationPreset}
            options={[
              { value: "last", label: "Last used" },
              { value: "10", label: "10 minutes" },
              { value: "30", label: "30 minutes" },
              { value: "60", label: "1 hour" },
            ]}
            onValueChange={(value) =>
              onChange({ durationPreset: value as DurationPreset })
            }
          />
        </Field>
        <SettingsCheckbox
          checked={settings.defaultSaveNewSessions}
          onChange={(checked) => onChange({ defaultSaveNewSessions: checked })}
        >
          Save new names as activities
        </SettingsCheckbox>
        <SettingsCheckbox
          checked={settings.confirmOnStop}
          onChange={(checked) => onChange({ confirmOnStop: checked })}
        >
          Confirm before saving or discarding
        </SettingsCheckbox>
      </SettingsGroup>
      <SettingsGroup title="Sound">
        <SettingsCheckbox
          checked={settings.soundEnabled}
          onChange={(checked) => onChange({ soundEnabled: checked })}
        >
          Play timer and goal sounds
        </SettingsCheckbox>
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
        <SettingsCheckbox
          checked={settings.offerBreakTimer}
          onChange={(checked) => onChange({ offerBreakTimer: checked })}
        >
          Offer break timer on pause and after saving
        </SettingsCheckbox>
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
        <SettingsCheckbox
          checked={settings.alwaysOnTop}
          onChange={(checked) => onChange({ alwaysOnTop: checked })}
        >
          Always on top
        </SettingsCheckbox>
        <SettingsCheckbox
          checked={settings.menuBarClockVisible}
          onChange={(checked) => onChange({ menuBarClockVisible: checked })}
        >
          Show clock in the menu bar
        </SettingsCheckbox>
        <Field label="Menu bar clock">
          <SelectMenu
            value={settings.menuBarClockStyle}
            disabled={!settings.menuBarClockVisible}
            options={[
              {
                value: "auto",
                label: "Auto (timer remaining / stopwatch elapsed)",
              },
              { value: "elapsed", label: "Always elapsed" },
              {
                value: "remaining",
                label: "Remaining when a duration is set",
              },
            ]}
            onValueChange={(value) =>
              onChange({
                menuBarClockStyle: value as MenuBarClockStyle,
              })
            }
          />
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

function SettingsCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-tempo-muted">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
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
      className="cursor-pointer rounded-xl border border-tempo-line bg-transparent px-3 py-2 text-sm text-tempo-muted hover:text-tempo-text"
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
