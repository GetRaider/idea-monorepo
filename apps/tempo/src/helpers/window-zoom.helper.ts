export const DESIGN_WINDOW_WIDTH = 980;
export const DESIGN_WINDOW_HEIGHT = 720;
export const MIN_ZOOM_FACTOR = 0.85;
export const MAX_ZOOM_FACTOR = 1.25;

export function resolveZoomFactor(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1;
  }

  const scale = Math.min(
    width / DESIGN_WINDOW_WIDTH,
    height / DESIGN_WINDOW_HEIGHT,
  );
  return Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, scale));
}
