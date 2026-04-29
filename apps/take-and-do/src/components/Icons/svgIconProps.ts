import type { CSSProperties } from "react";

/** Shared props for simple SVG icons (size + className). */
export type SvgIconProps = {
  size?: number;
  className?: string;
};

export type SvgIconPropsWithStyle = SvgIconProps & {
  style?: CSSProperties;
};

export type SvgIconWithDotProps = SvgIconProps & {
  showDot?: boolean;
};
