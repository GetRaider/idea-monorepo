import { cn } from "../lib/cn";

import { TempoLogo } from "./TempoLogo";

import type { AppScreen } from "../App.types";

const NAV_ITEMS: { id: AppScreen; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "history", label: "History" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

export function AppTopBar({
  activeScreen,
  statusLabel,
  isLive,
  onNavigate,
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-5 border-b border-tempo-line bg-[rgba(8,9,12,0.6)] px-8 py-5 backdrop-blur-[14px]">
      <div className="flex items-center gap-2.5 font-display text-[19px] font-semibold">
        <TempoLogo className="h-5 w-5 shrink-0" />
        Tempo
      </div>
      <nav className="flex flex-wrap justify-center gap-[26px]" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={activeScreen === item.id ? "page" : undefined}
            className={cn(
              "cursor-pointer border-0 bg-transparent text-sm transition-colors",
              activeScreen === item.id ? "text-tempo-text" : "text-tempo-muted hover:text-tempo-text",
            )}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div
        className={cn(
          "justify-self-end flex items-center gap-2 text-[13px] text-tempo-muted",
          isLive ? "text-tempo-text" : null,
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-tempo-faint",
            isLive ? "bg-tempo-live shadow-[0_0_0_3px_rgba(95,224,174,0.2)]" : null,
          )}
          aria-hidden
        />
        {statusLabel}
      </div>
    </header>
  );
}

interface AppTopBarProps {
  activeScreen: AppScreen;
  statusLabel: string;
  isLive: boolean;
  onNavigate: (screen: AppScreen) => void;
}
