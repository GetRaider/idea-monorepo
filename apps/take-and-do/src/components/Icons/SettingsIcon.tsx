import { cn } from "@/lib/styles/utils";
import type { SvgIconPropsWithStyle } from "./svgIconProps";

export function SettingsIcon({
  size = 20,
  className,
  style,
  ...props
}: SvgIconPropsWithStyle) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-current", className)}
      style={style}
      {...props}
    >
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a7.96 7.96 0 0 0 .06-1c0-.34-.02-.67-.06-1l2.05-1.6a.6.6 0 0 0 .14-.76l-1.94-3.36a.6.6 0 0 0-.73-.26l-2.42.97a7.8 7.8 0 0 0-1.73-1l-.36-2.57A.6.6 0 0 0 13.86 2h-3.72a.6.6 0 0 0-.59.5l-.36 2.57c-.62.25-1.2.58-1.73 1l-2.42-.97a.6.6 0 0 0-.73.26L2.37 8.72a.6.6 0 0 0 .14.76L4.56 11.08c-.04.33-.06.66-.06 1 0 .33.02.66.06 1l-2.05 1.6a.6.6 0 0 0-.14.76l1.94 3.36c.16.28.48.39.78.27l2.37-.95c.54.42 1.12.75 1.74 1l.36 2.57c.04.3.3.5.59.5h3.72c.3 0 .55-.2.59-.5l.36-2.57c.62-.25 1.2-.58 1.74-1l2.37.95c.3.12.62.01.78-.27l1.94-3.36a.6.6 0 0 0-.14-.76L19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
