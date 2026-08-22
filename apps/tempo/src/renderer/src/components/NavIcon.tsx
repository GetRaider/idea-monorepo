import type { ReactNode } from "react";

import { NavIconSvg } from "./NavIcon.styles";

import type { AppScreen } from "../App.types";

export function NavIcon({ screen, active }: NavIconProps) {
  return (
    <NavIconSvg viewBox="0 0 24 24" $active={active} aria-hidden="true">
      {NAV_ICON_PATHS[screen]}
    </NavIconSvg>
  );
}

const NAV_ICON_PATHS: Record<AppScreen, ReactNode> = {
  focus: (
    <>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </>
  ),
  history: (
    <>
      <path
        d="M8 7h8M8 12h8M8 17h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17" cy="17" r="1.6" fill="currentColor" />
    </>
  ),
  analytics: (
    <path
      d="M6 17V11M12 17V7M18 17V13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  settings: (
    <>
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
};

interface NavIconProps {
  screen: AppScreen;
  active: boolean;
}
