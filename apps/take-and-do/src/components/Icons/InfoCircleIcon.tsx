import type { CSSProperties } from "react";

export function InfoCircleIcon({
  size = 16,
  className,
  style,
}: InfoCircleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 16.5v-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}

interface InfoCircleIconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}
