export function TempoLogo({ className }: TempoLogoProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 32 32"
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" fill="#0c0814" />
      <circle
        cx="16"
        cy="16"
        r="9.3"
        fill="none"
        stroke="#f4eefe"
        strokeWidth="4.5"
      />
    </svg>
  );
}

interface TempoLogoProps {
  className?: string;
}
