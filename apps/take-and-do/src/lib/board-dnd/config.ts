import {
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export const BOARD_POINTER_DRAG_DISTANCE_PX = 4;

export function useBoardPointerSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: BOARD_POINTER_DRAG_DISTANCE_PX },
    }),
  );
}

export const BOARD_DROP_MEASURING = {
  droppable: { strategy: MeasuringStrategy.Always },
} as const;

/** Prefer vertical auto-scroll; avoid horizontal drift inside overflow-x parents. */
export const BOARD_AUTO_SCROLL = {
  threshold: { x: 0, y: 0.15 },
} as const;
