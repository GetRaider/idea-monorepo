import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { app } from "electron";

import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  parseStoredSettings,
} from "../helpers/settings.helper";
import type { AppSettings } from "../shared/settings.types";

let cachedSettings: AppSettings = DEFAULT_APP_SETTINGS;

export function loadAppSettings(): AppSettings {
  mkdirSync(app.getPath("userData"), { recursive: true });
  const filePath = getSettingsFilePath();
  if (!existsSync(filePath)) {
    cachedSettings = DEFAULT_APP_SETTINGS;
    persistAppSettings();
    return cachedSettings;
  }

  try {
    cachedSettings = parseStoredSettings(
      JSON.parse(readFileSync(filePath, "utf8")),
    );
  } catch {
    cachedSettings = DEFAULT_APP_SETTINGS;
  }

  persistAppSettings();
  return cachedSettings;
}

export function getAppSettings(): AppSettings {
  return cachedSettings;
}

export function updateAppSettings(patch: Partial<AppSettings>): AppSettings {
  cachedSettings = mergeAppSettings(cachedSettings, patch);
  persistAppSettings();
  return cachedSettings;
}

export function getSettingsFilePath(): string {
  return join(app.getPath("userData"), "settings.json");
}

function persistAppSettings(): void {
  writeFileSync(
    getSettingsFilePath(),
    `${JSON.stringify(cachedSettings, null, 2)}\n`,
  );
}
