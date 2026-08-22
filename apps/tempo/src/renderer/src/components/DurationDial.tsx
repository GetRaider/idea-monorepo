import {
  useCallback,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

import styled from "styled-components";

const VIEW_SIZE = 280;
const DIAL_CENTER = VIEW_SIZE / 2;
const DIAL_RADIUS = 86;
const INNER_RADIUS = 64;
const HANDLE_RADIUS = 7;
const LABEL_RADIUS = DIAL_RADIUS + 22;
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
const MINUTE_LABELS = Array.from({ length: 12 }, (_, index) => {
  const minute = index * 5;
  return { minute, label: String(minute) };
});

export function DurationDial({
  minutes,
  displayValue,
  unitLabel,
  caption = null,
  onChange,
  disabled = false,
}: DurationDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const labelId = useId();
  const glowId = `dial-glow-${labelId.replace(/:/g, "")}`;
  const fillId = `dial-fill-${labelId.replace(/:/g, "")}`;
  const safeMinutes = normalizeDialMinutes(minutes);
  const trackCircumference = 2 * Math.PI * DIAL_RADIUS;
  const progressLength = (safeMinutes / MAX_MINUTES) * trackCircumference;

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
        <defs>
          <radialGradient id={fillId} cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="70%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={INNER_RADIUS}
          fill={`url(#${fillId})`}
          pointerEvents="none"
        />
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_RADIUS}
          fill="none"
          stroke="rgba(155, 92, 255, 0.22)"
          strokeWidth={8}
          pointerEvents="none"
        />
        {safeMinutes > 0 ? (
          <circle
            cx={DIAL_CENTER}
            cy={DIAL_CENTER}
            r={DIAL_RADIUS}
            fill="none"
            stroke="#c4b5fd"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${trackCircumference}`}
            transform={`rotate(-90 ${DIAL_CENTER} ${DIAL_CENTER})`}
            filter={`url(#${glowId})`}
            pointerEvents="none"
          />
        ) : null}
        {Array.from({ length: 60 }, (_, minute) => {
          const tickRadians = minutesToRadians(minute);
          const isMajorTick = minute % 5 === 0;
          const tickLength = isMajorTick ? 8 : 4;
          const outer = polarToCartesian(
            tickRadians,
            DIAL_RADIUS + 6 + tickLength,
          );
          const inner = polarToCartesian(tickRadians, DIAL_RADIUS + 6);
          return (
            <line
              key={minute}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isMajorTick ? "#d8b4fe" : "rgba(196, 181, 253, 0.35)"}
              strokeWidth={isMajorTick ? 1.4 : 0.8}
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
              fill="#a78bfa"
              fontSize="11"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
        {handlePoint ? (
          <circle
            cx={handlePoint.x}
            cy={handlePoint.y}
            r={HANDLE_RADIUS}
            fill="#1a1028"
            stroke="#c4b5fd"
            strokeWidth={2.25}
            filter={`url(#${glowId})`}
            pointerEvents="none"
          />
        ) : null}
        <text
          x={DIAL_CENTER}
          y={DIAL_CENTER - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f8f4ff"
          fontSize={displayValue.length > 5 ? 22 : 28}
          fontWeight="700"
          pointerEvents="none"
        >
          {displayValue}
        </text>
        <text
          x={DIAL_CENTER}
          y={DIAL_CENTER + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#c4b5fd"
          fontSize="11"
          letterSpacing="0.08em"
          pointerEvents="none"
        >
          {unitLabel}
        </text>
      </DialSvg>
      {caption !== null && caption.length > 0 ? (
        <DialCaption>{caption}</DialCaption>
      ) : null}
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

const DialWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const DialSvg = styled.svg<{ $disabled: boolean }>`
  width: 280px;
  height: 280px;
  touch-action: none;
  user-select: none;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.85 : 1)};
`;

const DialCaption = styled.p`
  margin: 0.15rem 0 0;
  color: #8f84a8;
  font-size: 0.78rem;
`;

interface DurationDialProps {
  minutes: number;
  displayValue: string;
  unitLabel: string;
  caption?: string | null;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}
