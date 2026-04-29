import type { SvgIconProps } from "./svgIconProps";
export function SearchIcon({ size = 16, className }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <circle
        cx="6.5"
        cy="6.5"
        r="5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M10 10l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
