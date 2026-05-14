import { cn } from "@/lib/styles/utils";

/** Horizontal padding for main chrome (Calendar, Tasks, Settings, Overview). */
export const APP_CHROME_PADDING_X = "px-6 max-[600px]:px-4";

/** Full main content inset (matches Calendar / Settings chrome). */
export const APP_CHROME_MAIN_INSET = cn(
  APP_CHROME_PADDING_X,
  "py-6 max-[600px]:py-4",
);

/**
 * Page title / breadcrumbs plus primary actions — same flex rhythm everywhere.
 */
export const APP_CHROME_TITLE_ACTION_ROW = cn(
  "flex w-full min-w-0 shrink-0 flex-col gap-4",
  "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
);

/** Shared font scale for page titles and Tasks breadcrumbs. */
export const APP_CHROME_HEADING_SIZE = cn(
  "text-xl font-semibold leading-snug tracking-tight sm:text-2xl",
);

export const appChromeHeadingCurrentClass = cn(
  APP_CHROME_HEADING_SIZE,
  "text-zinc-100",
);

export const appChromeHeadingLinkClass = cn(
  APP_CHROME_HEADING_SIZE,
  "text-zinc-400 transition-colors hover:text-zinc-200",
);

/** Match primary nav rail glyphs (see Sidebar.tsx). */
export const APP_CHROME_NAV_ICON_PX = 24;
