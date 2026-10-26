"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DocType } from "@repo/api/todex";
import type { CalendarEvent, DocSummary, Epic, Space, Task } from "@repo/api/todex";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { todexClient } from "@lib/todex-client";

import { SearchIcon } from "./icons";

export function PlatformSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function close() {
    setQuery("");
    setOpen(false);
  }

  function openSearch() {
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "f" || !event.metaKey) return;
      if (event.shiftKey || event.altKey || event.repeat) return;
      event.preventDefault();
      setOpen((current) => {
        if (current) setQuery("");
        return !current;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <PlatformSearchContext
      value={{ query, setQuery, openSearch, close }}
    >
      {children}
      {open ? (
        <SearchPalette
          query={query}
          onQuery={setQuery}
          onClose={close}
        />
      ) : null}
    </PlatformSearchContext>
  );
}

export function usePlatformSearch() {
  const value = use(PlatformSearchContext);
  if (!value) {
    throw new Error("usePlatformSearch must be used within PlatformSearchProvider");
  }
  return value;
}

export function SearchButton() {
  const { openSearch } = usePlatformSearch();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Search"
          onClick={openSearch}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <SearchIcon size={20} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-1.5">
        Search
        <kbd className="rounded border border-white/20 px-1 font-sans text-[10px] leading-none">
          ⌘F
        </kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function SearchPalette({
  query,
  onQuery,
  onClose,
}: {
  query: string;
  onQuery: (query: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const spacesQuery = useQuery({
    queryKey: ["spaces"],
    queryFn: () => todexClient.spaces.list(),
  });
  const docsQuery = useQuery({
    queryKey: ["docs"],
    queryFn: () => todexClient.docs.list(),
  });
  const spaceIds = (spacesQuery.data ?? []).map((space) => space.id).join("\n");
  const tasksQuery = useQuery({
    queryKey: ["tasks", "search", spaceIds],
    queryFn: () =>
      Promise.all(
        (spacesQuery.data ?? []).map((space) =>
          todexClient.tasks.list({ spaceId: space.id }),
        ),
      ).then((lists) => lists.flat()),
    enabled: spacesQuery.isSuccess,
  });
  const epicsQuery = useQuery({
    queryKey: ["epics", "search", spaceIds],
    queryFn: () =>
      Promise.all(
        (spacesQuery.data ?? []).map((space) => todexClient.epics.list(space.id)),
      ).then((lists) => lists.flat()),
    enabled: spacesQuery.isSuccess,
  });
  const eventsQuery = useQuery({
    queryKey: ["calendar", "search", SEARCH_WINDOW.from, SEARCH_WINDOW.to],
    queryFn: () => todexClient.calendar.events.list(SEARCH_WINDOW),
  });
  const catalog = {
    spaces: spacesQuery.data ?? [],
    docs: docsQuery.data ?? [],
    tasks: tasksQuery.data ?? [],
    epics: epicsQuery.data ?? [],
    events: eventsQuery.data ?? [],
  };
  const results = searchHits({ query: debouncedQuery, ...catalog });
  const pending =
    spacesQuery.isPending ||
    docsQuery.isPending ||
    eventsQuery.isPending ||
    (spacesQuery.isSuccess && (tasksQuery.isPending || epicsQuery.isPending));

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  function openResult(hit: SearchHit) {
    router.push(hit.href);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-start justify-center bg-black/50 p-4 pt-[18vh]"
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-label="Search"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          const hits =
            query === debouncedQuery
              ? results
              : searchHits({ query, ...catalog });
          const hit = hits[query === debouncedQuery ? activeIndex : 0];
          if (hit) openResult(hit);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) =>
              results.length === 0 ? 0 : (index + 1) % results.length,
            );
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) =>
              results.length === 0
                ? 0
                : (index - 1 + results.length) % results.length,
            );
          }
        }}
      >
        <input
          autoFocus
          value={query}
          placeholder="Search"
          aria-label="Search"
          className="w-full bg-transparent px-4 py-4 text-lg text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => onQuery(event.target.value)}
        />
        {debouncedQuery.trim() ? (
          <div className="max-h-80 overflow-y-auto border-t border-border p-1">
            {pending && results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No matches.</p>
            ) : (
              results.map((hit, index) => (
                <Link
                  key={`${hit.kind}-${hit.id}`}
                  href={hit.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    index === activeIndex ? "bg-white/10" : "hover:bg-white/5",
                  )}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={onClose}
                >
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">
                    {hit.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{hit.title}</span>
                  {hit.detail ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {hit.detail}
                    </span>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        ) : null}
      </form>
    </div>
  );
}

function searchHits({
  query,
  spaces,
  docs,
  tasks,
  epics,
  events,
}: {
  query: string;
  spaces: Space[];
  docs: DocSummary[];
  tasks: Task[];
  epics: Epic[];
  events: CalendarEvent[];
}) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const spaceNameById = new Map(spaces.map((space) => [space.id, space.name]));
  const hits: SearchHit[] = [
    ...tasks.flatMap((task) => {
      const spaceName = spaceNameById.get(task.spaceId);
      if (!spaceName || !includesQuery(needle, task.summary, task.taskKey)) return [];
      return [
        {
          id: task.id,
          kind: "Task",
          title: task.summary,
          detail: task.taskKey,
          href: tasksUrlHelper.routing.buildBoardUrl(spaceName, task.taskKey),
        },
      ];
    }),
    ...docs.flatMap((doc) => {
      if (!includesQuery(needle, doc.title, doc.docKey)) return [];
      const goal = doc.type === DocType.GOAL;
      return [
        {
          id: doc.id,
          kind: goal ? "Goal" : "Doc",
          title: doc.title,
          detail: doc.docKey,
          href: goal ? `/planning/goals/${doc.id}` : `/knowledge/${doc.id}`,
        },
      ];
    }),
    ...epics.flatMap((epic) => {
      const spaceName = spaceNameById.get(epic.spaceId);
      if (!spaceName || !includesQuery(needle, epic.name)) return [];
      return [
        {
          id: epic.id,
          kind: "Epic",
          title: epic.name,
          detail: spaceName,
          href: tasksUrlHelper.routing.buildEpicUrl(spaceName, epic.id),
        },
      ];
    }),
    ...events.flatMap((event) => {
      if (!includesQuery(needle, event.title)) return [];
      return [
        {
          id: event.id,
          kind: "Event",
          title: event.title,
          detail: "",
          href: `/calendar/events/${event.id}`,
        },
      ];
    }),
    ...spaces.flatMap((space) => {
      if (!includesQuery(needle, space.name)) return [];
      return [
        {
          id: space.id,
          kind: "Space",
          title: space.name,
          detail: "",
          href: tasksUrlHelper.routing.buildBoardUrl(space.name),
        },
      ];
    }),
  ];
  return hits
    .toSorted((left, right) => rank(needle, left) - rank(needle, right))
    .slice(0, 20);
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);
  return debounced;
}

function includesQuery(needle: string, ...fields: string[]) {
  return fields.some((field) => field.toLowerCase().includes(needle));
}

function rank(needle: string, hit: SearchHit) {
  return hit.title.toLowerCase().startsWith(needle) ? 0 : 1;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_WINDOW = searchWindow();

function searchWindow() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setMonth(from.getMonth() - 6);
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  to.setMonth(to.getMonth() + 6);
  return { from: from.toISOString(), to: to.toISOString() };
}

const PlatformSearchContext = createContext<PlatformSearchContextValue | null>(
  null,
);

interface PlatformSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  openSearch: () => void;
  close: () => void;
}

interface SearchHit {
  id: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
}
