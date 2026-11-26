import { readFileSync, writeFileSync } from "node:fs";

export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 800;
export const MIN_WINDOW_WIDTH = 960;
export const MIN_WINDOW_HEIGHT = 600;

const MAX_WINDOW_EDGE = 16_000;

export function loadWindowState(filePath: string): SavedWindowState | null {
  try {
    return parseWindowState(JSON.parse(readFileSync(filePath, "utf8")));
  } catch {
    return null;
  }
}

export function saveWindowState(
  filePath: string,
  state: SavedWindowState,
): void {
  writeFileSync(filePath, JSON.stringify(state));
}

export function parseWindowState(value: unknown): SavedWindowState | null {
  if (!isRecord(value)) return null;
  const x = finiteNumber(value.x);
  const y = finiteNumber(value.y);
  const width = finiteNumber(value.width);
  const height = finiteNumber(value.height);
  if (x === null || y === null || width === null || height === null)
    return null;
  if (width > MAX_WINDOW_EDGE || height > MAX_WINDOW_EDGE) return null;
  return {
    bounds: {
      x,
      y,
      width: Math.max(MIN_WINDOW_WIDTH, width),
      height: Math.max(MIN_WINDOW_HEIGHT, height),
    },
    maximized: value.maximized === true,
  };
}

export function placeWindow(
  saved: SavedWindowState | null,
  workAreas: readonly WorkArea[],
): SavedWindowState {
  const fallback = defaultWindowState(workAreas);
  if (!saved) return fallback;
  if (intersectsWorkArea(saved.bounds, workAreas)) return saved;
  const home = workAreas[0] ?? fallback.bounds;
  return {
    bounds: centerWithin(home, saved.bounds.width, saved.bounds.height),
    maximized: saved.maximized,
  };
}

function defaultWindowState(workAreas: readonly WorkArea[]): SavedWindowState {
  const home = workAreas[0];
  if (!home) {
    return {
      bounds: {
        x: 0,
        y: 0,
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
      },
      maximized: false,
    };
  }
  return {
    bounds: centerWithin(home, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT),
    maximized: false,
  };
}

function centerWithin(
  workArea: WorkArea,
  width: number,
  height: number,
): WindowBounds {
  const fittedWidth = Math.min(width, workArea.width);
  const fittedHeight = Math.min(height, workArea.height);
  return {
    x: Math.round(workArea.x + (workArea.width - fittedWidth) / 2),
    y: Math.round(workArea.y + (workArea.height - fittedHeight) / 2),
    width: fittedWidth,
    height: fittedHeight,
  };
}

function intersectsWorkArea(
  bounds: WindowBounds,
  workAreas: readonly WorkArea[],
): boolean {
  return workAreas.some((workArea) => {
    const horizontal =
      Math.min(bounds.x + bounds.width, workArea.x + workArea.width) -
      Math.max(bounds.x, workArea.x);
    const vertical =
      Math.min(bounds.y + bounds.height, workArea.y + workArea.height) -
      Math.max(bounds.y, workArea.y);
    return horizontal >= 80 && vertical >= 80;
  });
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorkArea = WindowBounds;

export type SavedWindowState = {
  bounds: WindowBounds;
  maximized: boolean;
};
