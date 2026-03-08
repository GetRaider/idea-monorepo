interface ChevronDownIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ChevronDownIcon({
  size = 16,
  className,
  style,
}: ChevronDownIconProps) {
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
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
