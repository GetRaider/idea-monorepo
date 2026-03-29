export function DefaultAvatarIcon({ size = 160 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className="h-9 w-9 cursor-pointer rounded-full border-2 border-border-app transition-transform duration-200 hover:scale-105 hover:border-indigo-500"
    >
      <defs>
        <clipPath id="clip">
          <rect x="0" y="0" width="160" height="160" rx="36" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="160" height="160" rx="36" fill="#9aa5b1" />
      <g clipPath="url(#clip)">
        <circle cx="80" cy="68" r="44" fill="#e8eaed" />
        <ellipse cx="80" cy="184" rx="70" ry="56" fill="#e8eaed" />
      </g>
    </svg>
  );
}
