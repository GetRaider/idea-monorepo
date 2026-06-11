"use client";

import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { cn } from "@/lib/styles/utils";

export function FocusBacklogPicker() {
  const { backlog, idleDraft, selectBacklogSession } = useFocusSessionContext();

  if (backlog.length === 0) {
    return (
      <p className="m-0 text-xs text-text-secondary">
        No backlog sessions yet. Save a new session to the backlog to reuse it
        here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="m-0 text-xs font-medium text-text-secondary">
        Select a session
      </p>
      <ul className="m-0 flex min-h-[12rem] list-none flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
        {backlog.map((item, index) => {
          const selected = idleDraft.selectedBacklogId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => selectBacklogSession(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                  selected
                    ? "border-white/25 bg-white/10 text-text-primary"
                    : "border-white/10 bg-black/20 text-text-secondary hover:border-white/18 hover:text-text-primary",
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border border-white/20"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="truncate font-medium">
                  #{index + 1} {item.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
