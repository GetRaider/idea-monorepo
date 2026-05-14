import type { SvgIconPropsWithStyle } from "./svgIconProps";

type ChevronRightIconProps = SvgIconPropsWithStyle & {
  /** Stroke width for the chevron path (default matches previous 1.5). */
  strokeWidth?: number;
};

export function ChevronRightIcon({
  size = 16,
  className,
  style,
  strokeWidth = 1.5,
}: ChevronRightIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={style}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
