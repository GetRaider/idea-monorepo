import type { SvgIconProps } from "./svgIconProps";
export function TrashIcon({ size = 16, className }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M5.5 7v4M10.5 7v4M4 4v8a1 1 0 001 1h6a1 1 0 001-1V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
