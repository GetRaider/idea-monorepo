interface LightningStatIconProps {
  size?: number;
  className?: string;
}

export function LightningStatIcon({
  size = 24,
  className,
}: LightningStatIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M13 10V3L4 14h7v7l9-11h-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
