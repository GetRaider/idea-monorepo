import {
  Button,
  CheckboxField,
  Field,
  FieldLabel,
  Select,
  SettingsCopy,
} from "../App.styles";

import {
  DataActions,
  RangeField,
  RangeInput,
  SettingsForm,
  SettingsGroup,
  SettingsGroupTitle,
} from "./SettingsSection.styles";

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
    <SettingsForm>
      <SettingsGroup>
        <SettingsGroupTitle>Defaults</SettingsGroupTitle>
        <Field>
          <FieldLabel>Default mode</FieldLabel>
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
        <Field>
          <FieldLabel>Default duration</FieldLabel>
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
        <CheckboxField>
          <input
            type="checkbox"
            checked={settings.defaultSaveNewSessions}
            onChange={(event) =>
              onChange({ defaultSaveNewSessions: event.target.checked })
            }
          />
          Save new names to Regular Sessions
        </CheckboxField>
      </SettingsGroup>
      <SettingsGroup>
        <SettingsGroupTitle>Sound</SettingsGroupTitle>
        <CheckboxField>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) =>
              onChange({ soundEnabled: event.target.checked })
            }
          />
          Play timer and goal sounds
        </CheckboxField>
        <RangeField>
          Volume ({Math.round(settings.soundVolume * 100)}%)
          <RangeInput
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
        </RangeField>
      </SettingsGroup>
      <SettingsGroup>
        <SettingsGroupTitle>Break</SettingsGroupTitle>
        <CheckboxField>
          <input
            type="checkbox"
            checked={settings.offerBreakTimer}
            onChange={(event) =>
              onChange({ offerBreakTimer: event.target.checked })
            }
          />
          Offer break timer on pause and after saving
        </CheckboxField>
        <Field>
          <FieldLabel>Default break duration (minutes)</FieldLabel>
          <Select
            value={String(settings.breakDurationMinutes)}
            onChange={(event) =>
              onChange({ breakDurationMinutes: Number(event.target.value) })
            }
          >
            {[5, 10, 15, 20, 25, 30].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </Select>
        </Field>
      </SettingsGroup>
      <SettingsGroup>
        <SettingsGroupTitle>Window</SettingsGroupTitle>
        <CheckboxField>
          <input
            type="checkbox"
            checked={settings.alwaysOnTop}
            onChange={(event) =>
              onChange({ alwaysOnTop: event.target.checked })
            }
          />
          Always on top
        </CheckboxField>
        <CheckboxField>
          <input
            type="checkbox"
            checked={settings.confirmOnStop}
            onChange={(event) =>
              onChange({ confirmOnStop: event.target.checked })
            }
          />
          Confirm before saving or discarding
        </CheckboxField>
        <CheckboxField>
          <input
            type="checkbox"
            checked={settings.menuBarClockVisible}
            onChange={(event) =>
              onChange({ menuBarClockVisible: event.target.checked })
            }
          />
          Show clock in the menu bar
        </CheckboxField>
        <Field>
          <FieldLabel>Menu bar clock</FieldLabel>
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
      <SettingsGroup>
        <SettingsGroupTitle>Data</SettingsGroupTitle>
        <SettingsCopy>
          Sessions and records are stored locally in SQLite on this Mac. No
          account, no cloud.
        </SettingsCopy>
        <DataActions>
          <Button
            type="button"
            $variant="ghost"
            onClick={() => void window.tempo.revealData()}
          >
            Reveal in Finder
          </Button>
          <Button
            type="button"
            $variant="ghost"
            onClick={() => void window.tempo.exportData()}
          >
            Export
          </Button>
          <Button
            type="button"
            $variant="ghost"
            onClick={() => void onImport()}
          >
            Import
          </Button>
        </DataActions>
      </SettingsGroup>
    </SettingsForm>
  );
}

interface SettingsSectionProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onImport: () => Promise<void>;
}
