import type { SvgIconPropsWithStyle } from "./svgIconProps";
export function ChevronRightIcon({
  size = 16,
  className,
  style,
}: SvgIconPropsWithStyle) {
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
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
