import { cn } from "@/lib/styles/utils";

/**
 * App chrome spacing uses an 8px grid (Tailwind default scale).
 * Horizontal gutters are shared so the page title and in-card module titles align on one column.
 */

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

/** Level 1: screen title (Overview, Calendar, Settings, …). */
export const APP_CHROME_HEADING_SIZE = cn(
  "text-2xl font-semibold leading-tight tracking-tight sm:text-3xl",
);

/** Level 2: in-card module titles (Productivity Overview, Timeline Planning, …). */
export const APP_CHROME_SECTION_TITLE_SIZE = cn(
  "text-sm font-semibold leading-snug tracking-tight text-text-primary sm:text-base",
);

/** Space between page-title icon and label — keep in sync with `SectionTitle` icon gap. */
export const APP_CHROME_PAGE_TITLE_ICON_GAP = "gap-3";

/** Bottom margin under the page title / welcome row. */
export const APP_CHROME_WELCOME_SECTION_MARGIN = "mb-6 sm:mb-8";

/** Vertical gap between major stacked blocks under the welcome row. */
export const APP_CHROME_PAGE_BLOCK_GAP = "gap-6";

/**
 * Dashboard module header / body (Productivity Overview, Timeline Planning):
 * 12px padding (`p-3` = 0.75rem at 16px root).
 */
export const APP_CHROME_SECTION_HEAD_PADDING = "p-3";

export const APP_CHROME_SECTION_BODY_PADDING = "p-3";

/** Gap between paired header controls (e.g. filter dropdown + AI action). */
export const APP_CHROME_HEADER_CONTROL_GAP = "gap-2";

/** Module title row icons — slightly smaller than the page title icon. */
export const APP_CHROME_SECTION_MODULE_ICON_PX = 20;

export const appChromeHeadingCurrentClass = cn(
  APP_CHROME_HEADING_SIZE,
  "text-text-primary",
);

export const appChromeHeadingLinkClass = cn(
  APP_CHROME_HEADING_SIZE,
  "text-zinc-400 transition-colors hover:text-zinc-200",
);

/** Match primary nav rail glyphs (see Sidebar.tsx). */
export const APP_CHROME_NAV_ICON_PX = 24;

/** Slightly larger glyph next to the main page title (Overview, …). */
export const APP_CHROME_PAGE_TITLE_ICON_PX = 28;
