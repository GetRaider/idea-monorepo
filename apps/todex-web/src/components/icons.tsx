import type { SVGProps } from "react";

export function OverviewIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function TasksIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12.5 10.5 15 16 9" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  );
}

export function DocsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3 12h2.2M18.8 12H21M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

export function BoardIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M10 5v14M4 10h16" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...iconSvgProps(props)}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function StatusTodoIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function StatusInProgressIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...iconSvgProps(props)}>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
    </svg>
  );
}

export function StatusDoneIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      {...iconSvgProps(props)}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5 11 15l4.5-5.5" />
    </svg>
  );
}

function iconSvgProps({ size = 20, className, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    className,
    ...props,
  };
}

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
