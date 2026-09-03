import { copyFileSync } from "node:fs";

import { BrowserWindow, dialog, ipcMain, shell } from "electron";

import type {
  AddManualRecordInput,
  CreateSavedSessionInput,
  StartBreakInput,
  StartSessionInput,
  UpdateRecordInput,
  UpdateSavedSessionInput,
} from "../shared/records.types";
import type { AppSettings } from "../shared/settings.types";

import {
  getDatabaseFilePath,
  persistDatabase,
  reloadDatabaseFromFile,
} from "./db";
import {
  addManualRecord,
  deleteCompletedRecord,
  discardBreakSession,
  discardSession,
  getActiveRecord,
  getActiveSessionState,
  listRecords,
  pauseBreakSession,
  pauseSession,
  resumeSession,
  startBreakSession,
  startSession,
  stopBreakSession,
  stopSession,
  updateCompletedRecord,
} from "./records.repository";
import {
  createSavedSession,
  deleteSavedSession,
  listSavedSessions,
  migrateRestSessionToBreak,
  updateSavedSession,
} from "./sessions.repository";
import { getAppSettings, updateAppSettings } from "./settings.store";

export function registerRecordIpcHandlers(): void {
  ipcMain.handle("records:list", () => listRecords());
  ipcMain.handle("records:getActive", () => getActiveRecord());
  ipcMain.handle("records:getActiveState", () => getActiveSessionState());
  ipcMain.handle("records:start", (_event, input: StartSessionInput) =>
    startSession(input),
  );
  ipcMain.handle("records:startBreak", (_event, input: StartBreakInput) =>
    startBreakSession(input.plannedSeconds),
  );
  ipcMain.handle("records:pause", () => pauseSession());
  ipcMain.handle("records:resume", () => resumeSession());
  ipcMain.handle("records:pauseBreak", () => pauseBreakSession());
  ipcMain.handle("records:stop", () => stopSession());
  ipcMain.handle("records:stopBreak", () => stopBreakSession());
  ipcMain.handle("records:discard", () => discardSession());
  ipcMain.handle("records:discardBreak", () => discardBreakSession());
  ipcMain.handle("records:addManual", (_event, input: AddManualRecordInput) =>
    addManualRecord(input),
  );
  ipcMain.handle("records:update", (_event, input: UpdateRecordInput) =>
    updateCompletedRecord(input),
  );
  ipcMain.handle("records:delete", (_event, recordId: string) =>
    deleteCompletedRecord(recordId),
  );
  ipcMain.handle("sessions:list", () => listSavedSessions());
  ipcMain.handle("sessions:create", (_event, input: CreateSavedSessionInput) =>
    createSavedSession(input.name),
  );
  ipcMain.handle("sessions:update", (_event, input: UpdateSavedSessionInput) =>
    updateSavedSession(input),
  );
  ipcMain.handle("sessions:delete", (_event, sessionId: string) =>
    deleteSavedSession(sessionId),
  );
}

export function registerSettingsIpcHandlers(
  applyChrome: (settings: AppSettings) => void,
): void {
  ipcMain.handle("settings:get", () => getAppSettings());
  ipcMain.handle("settings:update", (_event, patch: Partial<AppSettings>) => {
    const settings = updateAppSettings(patch);
    applyChrome(settings);
    return settings;
  });
  ipcMain.handle("settings:revealData", () => {
    shell.showItemInFolder(getDatabaseFilePath());
  });
  ipcMain.handle("settings:exportData", async (event) => {
    persistDatabase();
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const result = parentWindow
      ? await dialog.showSaveDialog(parentWindow, {
          title: "Export Tempo data",
          defaultPath: "tempo.sqlite",
          filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
        })
      : await dialog.showSaveDialog({
          title: "Export Tempo data",
          defaultPath: "tempo.sqlite",
          filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
        });
    if (result.canceled || result.filePath === undefined) {
      return false;
    }

    copyFileSync(getDatabaseFilePath(), result.filePath);
    return true;
  });
  ipcMain.handle("settings:importData", async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const openResult = parentWindow
      ? await dialog.showOpenDialog(parentWindow, {
          title: "Import Tempo data",
          filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
          properties: ["openFile"],
        })
      : await dialog.showOpenDialog({
          title: "Import Tempo data",
          filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
          properties: ["openFile"],
        });
    if (openResult.canceled || openResult.filePaths[0] === undefined) {
      return false;
    }

    const confirmResult = parentWindow
      ? await dialog.showMessageBox(parentWindow, {
          type: "warning",
          buttons: ["Replace", "Cancel"],
          defaultId: 1,
          cancelId: 1,
          title: "Replace local data?",
          message: "Importing replaces all sessions and records on this Mac.",
        })
      : await dialog.showMessageBox({
          type: "warning",
          buttons: ["Replace", "Cancel"],
          defaultId: 1,
          cancelId: 1,
          title: "Replace local data?",
          message: "Importing replaces all sessions and records on this Mac.",
        });
    if (confirmResult.response !== 0) {
      return false;
    }

    persistDatabase();
    copyFileSync(openResult.filePaths[0], getDatabaseFilePath());
    reloadDatabaseFromFile(getDatabaseFilePath());
    migrateRestSessionToBreak();
    return true;
  });
}
