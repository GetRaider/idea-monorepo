import type { SvgIconProps } from "./svgIconProps";
export function ClockCircleIcon({ size = 20, className }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
