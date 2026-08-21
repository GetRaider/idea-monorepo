import { join } from "node:path";
import { writeFileSync } from "node:fs";

import {
  app,
  BrowserWindow,
  dialog,
  nativeImage,
  type NativeImage,
} from "electron";

import { encodeAppIconPng } from "../helpers/icon.helper";

import { initDatabase, persistDatabase } from "./db";
import { registerRecordIpcHandlers, registerSettingsIpcHandlers } from "./ipc";
import { configureTempoUserDataPath } from "./migrate-legacy-user-data";
import { loadAppSettings, getAppSettings } from "./settings.store";
import {
  createStatusTray,
  destroyStatusTray,
  isStatusTrayCreated,
} from "./status-tray";

function createWindow(alwaysOnTop: boolean): void {
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 720,
    minHeight: 640,
    title: "Tempo",
    backgroundColor: "#0c0814",
    icon: createAppIconImage(),
    alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && rendererUrl) {
    mainWindow.loadURL(rendererUrl);
    return;
  }

  mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
}

function showMainWindow(): void {
  const existingWindow = BrowserWindow.getAllWindows()[0];
  if (existingWindow === undefined) {
    createWindow(getAppSettings().alwaysOnTop);
    return;
  }

  if (existingWindow.isMinimized()) {
    existingWindow.restore();
  }

  existingWindow.show();
  existingWindow.focus();
}

configureTempoUserDataPath();

app.whenReady().then(async () => {
  app.on("activate", () => {
    showMainWindow();
  });

  if (process.platform === "darwin") {
    app.dock?.setIcon(createAppIconImage());
  }

  try {
    await initDatabase(app.getPath("userData"));
    const settings = loadAppSettings();
    registerRecordIpcHandlers();
    registerSettingsIpcHandlers(applyWindowChrome);
    applyWindowChrome(settings);
    createWindow(settings.alwaysOnTop);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to start Tempo";
    writeStartupError(error);
    dialog.showErrorBox("Tempo", message);
    createWindow(getAppSettings().alwaysOnTop);
  }
});

app.on("before-quit", () => {
  destroyStatusTray();
  persistDatabase();
});

app.on("window-all-closed", () => {
  persistDatabase();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function applyWindowChrome(settings: {
  alwaysOnTop: boolean;
  menuBarClockVisible: boolean;
}): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.setAlwaysOnTop(settings.alwaysOnTop);
  }

  if (settings.menuBarClockVisible) {
    if (!isStatusTrayCreated()) {
      createStatusTray(showMainWindow);
    }
    return;
  }

  destroyStatusTray();
}

function writeStartupError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "";
  try {
    writeFileSync(
      join(app.getPath("userData"), "last-start-error.txt"),
      `${new Date().toISOString()}\n${message}\n${stack}\n`,
    );
  } catch {
    // app paths can be unavailable during very early crashes
  }
}

function createAppIconImage(): NativeImage {
  return nativeImage.createFromBuffer(encodeAppIconPng(512));
}
