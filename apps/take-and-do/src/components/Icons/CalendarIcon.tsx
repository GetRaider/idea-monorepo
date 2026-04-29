import type { SvgIconWithDotProps } from "./svgIconProps";
export function CalendarIcon({
  size = 14,
  className,
  showDot = false,
}: SvgIconWithDotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <rect
        x="2"
        y="3"
        width="10"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M2 5h10M5 2v2M9 2v2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {showDot && <circle cx="7" cy="8" r="1.5" fill="currentColor" />}
    </svg>
  );
}
