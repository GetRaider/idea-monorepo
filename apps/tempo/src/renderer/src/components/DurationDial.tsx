import {
  useCallback,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

import styled from "styled-components";

const VIEW_SIZE = 200;
const DIAL_CENTER = VIEW_SIZE / 2;
const DIAL_RADIUS = 68;
const HANDLE_RADIUS = 8;
const LABEL_RADIUS = DIAL_RADIUS + 18;
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
const MINUTE_LABELS = Array.from({ length: 12 }, (_, index) => {
  const minute = index * 5;
  return { minute, label: String(minute) };
});

export function DurationDial({
  minutes,
  onChange,
  disabled = false,
}: DurationDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const labelId = useId();
  const safeMinutes = normalizeDialMinutes(minutes);

  const handlePointer = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (disabled) {
        return;
      }
      const svgElement = svgRef.current;
      if (!svgElement) {
        return;
      }

      const point = svgElement.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformed = point.matrixTransform(
        svgElement.getScreenCTM()?.inverse(),
      );
      onChange(pointToMinutes(transformed.x, transformed.y));
    },
    [disabled, onChange],
  );

  const handleRadians = minutesToRadians(
    safeMinutes >= MAX_MINUTES ? MAX_MINUTES : safeMinutes,
  );
  const handlePoint =
    safeMinutes > 0 ? polarToCartesian(handleRadians, DIAL_RADIUS) : null;
  const fillPath = describeFillWedge(safeMinutes);

  return (
    <DialWrap>
      <DialSvg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        role="slider"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={MAX_MINUTES}
        aria-valuenow={safeMinutes}
        aria-disabled={disabled}
        $disabled={disabled}
        onPointerDown={handlePointer}
        onPointerMove={(event) => {
          if (event.buttons !== 1) {
            return;
          }
          handlePointer(event);
        }}
      >
        <title id={labelId}>Session duration</title>
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_RADIUS}
          fill="none"
          stroke="#3a2a55"
          strokeWidth={10}
          pointerEvents="none"
        />
        {Array.from({ length: 60 }, (_, minute) => {
          const tickRadians = minutesToRadians(minute);
          const isMajorTick = minute % 5 === 0;
          const tickLength = isMajorTick ? 9 : 4;
          const outer = polarToCartesian(tickRadians, DIAL_RADIUS);
          const inner = polarToCartesian(tickRadians, DIAL_RADIUS - tickLength);
          return (
            <line
              key={minute}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isMajorTick ? "#c4b5fd" : "rgba(155, 92, 255, 0.35)"}
              strokeWidth={isMajorTick ? 1.25 : 0.75}
              pointerEvents="none"
            />
          );
        })}
        {MINUTE_LABELS.map(({ minute, label }) => {
          const labelPoint = polarToCartesian(
            minutesToRadians(minute),
            LABEL_RADIUS,
          );
          return (
            <text
              key={label}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#c4b5fd"
              fontSize="9"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
        {fillPath ? (
          <path
            d={fillPath}
            fill="rgba(155, 92, 255, 0.55)"
            pointerEvents="none"
          />
        ) : null}
        {handlePoint ? (
          <circle
            cx={handlePoint.x}
            cy={handlePoint.y}
            r={HANDLE_RADIUS}
            fill="#9b5cff"
            stroke="#f4eefe"
            strokeWidth={1.25}
            pointerEvents="none"
          />
        ) : null}
        <text
          x={DIAL_CENTER}
          y={DIAL_CENTER - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f4eefe"
          fontSize="22"
          fontWeight="700"
          pointerEvents="none"
        >
          {`${String(safeMinutes).padStart(2, "0")}:00`}
        </text>
        <text
          x={DIAL_CENTER}
          y={DIAL_CENTER + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9b8fb0"
          fontSize="10"
          pointerEvents="none"
        >
          mins
        </text>
      </DialSvg>
    </DialWrap>
  );
}

function normalizeDialMinutes(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_MINUTES;
  }
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

function minutesToRadians(minutes: number): number {
  const normalized = minutes === 60 ? 60 : minutes;
  return -Math.PI / 2 + (normalized / MAX_MINUTES) * 2 * Math.PI;
}

function polarToCartesian(radians: number, radius = DIAL_RADIUS) {
  return {
    x: DIAL_CENTER + radius * Math.cos(radians),
    y: DIAL_CENTER + radius * Math.sin(radians),
  };
}

function pointToMinutes(x: number, y: number): number {
  const deltaX = x - DIAL_CENTER;
  const deltaY = y - DIAL_CENTER;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < DIAL_RADIUS * 0.28) {
    return MIN_MINUTES;
  }

  const radians = Math.atan2(deltaY, deltaX);
  let fromTop = radians + Math.PI / 2;
  if (fromTop < 0) {
    fromTop += 2 * Math.PI;
  }

  const rawMinutes = Math.round((fromTop / (2 * Math.PI)) * MAX_MINUTES);
  if (rawMinutes <= 0) {
    return MAX_MINUTES;
  }
  return clampMinutes(rawMinutes);
}

function describeFillWedge(minutes: number): string {
  if (minutes <= 0) {
    return "";
  }

  if (minutes >= MAX_MINUTES) {
    const top = polarToCartesian(minutesToRadians(0));
    const bottom = polarToCartesian(minutesToRadians(30));
    return [
      `M ${DIAL_CENTER} ${DIAL_CENTER}`,
      `L ${top.x} ${top.y}`,
      `A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 1 1 ${bottom.x} ${bottom.y}`,
      `A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 1 1 ${top.x} ${top.y}`,
      "Z",
    ].join(" ");
  }

  const start = polarToCartesian(minutesToRadians(0));
  const end = polarToCartesian(minutesToRadians(minutes));
  const largeArc = minutes > 30 ? 1 : 0;
  return [
    `M ${DIAL_CENTER} ${DIAL_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

const DialWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DialSvg = styled.svg<{ $disabled: boolean }>`
  width: 220px;
  height: 220px;
  touch-action: none;
  user-select: none;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.85 : 1)};
`;

interface DurationDialProps {
  minutes: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}
