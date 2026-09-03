import { Menu, Tray, app, nativeImage } from "electron";
import type { NativeImage } from "electron";

import { encodeTrayTemplatePng } from "../helpers/icon.helper";
import { formatMenuBarClock } from "../helpers/elapsed.helper";

import { getActiveBreakRecord, getActiveFocusRecord } from "./records.repository";
import { getAppSettings } from "./settings.store";

export function createStatusTray(showWindow: () => void): void {
  destroyStatusTray();

  statusTray = new Tray(createTrayTemplateImage());
  statusTray.setIgnoreDoubleClickEvents(true);
  statusTray.setToolTip("Tempo");
  statusTray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show Tempo", click: showWindow },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
  statusTray.on("click", showWindow);

  refreshStatusTray();
  tickIntervalId = setInterval(refreshStatusTray, 1000);
}

export function isStatusTrayCreated(): boolean {
  return statusTray !== null;
}

export function destroyStatusTray(): void {
  if (tickIntervalId !== null) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }

  statusTray?.destroy();
  statusTray = null;
}

let statusTray: Tray | null = null;
let tickIntervalId: ReturnType<typeof setInterval> | null = null;

function refreshStatusTray(): void {
  if (statusTray === null) {
    return;
  }

  try {
    const breakRecord = getActiveBreakRecord();
    const record = breakRecord ?? getActiveFocusRecord();
    const title = formatMenuBarClock(
      record,
      Date.now(),
      getAppSettings().menuBarClockStyle,
    );
    statusTray.setTitle(title, { fontType: "monospacedDigit" });
    statusTray.setToolTip(record === null ? "Tempo" : record.name);
  } catch {
    statusTray.setTitle("");
  }
}

function createTrayTemplateImage(): NativeImage {
  const image = nativeImage.createFromBuffer(encodeTrayTemplatePng(16), {
    scaleFactor: 1,
  });
  image.addRepresentation({
    scaleFactor: 2,
    buffer: encodeTrayTemplatePng(32),
  });
  image.setTemplateImage(true);
  return image;
}
