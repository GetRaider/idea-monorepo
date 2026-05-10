"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Input } from "@/components/Input";
import { cn } from "@/lib/styles/utils";
import type { CalendarAxisTimeZone } from "@/types/calendar.types";

import {
  AXIS_TZ_LOCAL_SENTINEL,
  formatAxisHeaderLabel,
} from "./calendar-axis-time";
import { timeZoneOptions } from "./timezones";

type PanelMode = "menu" | "pick" | "rename" | "add";

export interface CalendarAxisCornerProps {
  zones: CalendarAxisTimeZone[];
  onZonesChange: (next: CalendarAxisTimeZone[]) => void;
}

function zonePickChoices(): { value: string; label: string }[] {
  const fromIntl = timeZoneOptions().filter((o) => o.value !== "");
  return [
    { value: AXIS_TZ_LOCAL_SENTINEL, label: "This device" },
    ...fromIntl.map((o) => ({ value: o.value, label: o.label })),
  ];
}

function clampPopover(
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const pad = 8;
  const l = Math.min(
    Math.max(pad, left),
    Math.max(pad, window.innerWidth - width - pad),
  );
  const t = Math.min(
    Math.max(pad, top),
    Math.max(pad, window.innerHeight - height - pad),
  );
  return { left: l, top: t };
}

export function CalendarAxisCorner({
  zones,
  onZonesChange,
}: CalendarAxisCornerProps) {
  const [tick, setTick] = useState(0);
  const pickChoices = useMemo(() => zonePickChoices(), []);

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<PanelMode>("menu");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [addSelectedIana, setAddSelectedIana] = useState<string | null>(null);
  const [addNameDraft, setAddNameDraft] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);
  const cornerWrapRef = useRef<HTMLDivElement>(null);

  const activeZone = useMemo(
    () => zones.find((z) => z.id === activeId) ?? null,
    [zones, activeId],
  );

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPanel("menu");
    setActiveId(null);
    setAnchorRect(null);
    setFilter("");
    setRenameDraft("");
    setAddSelectedIana(null);
    setAddNameDraft("");
  }, []);

  const openAddPopover = useCallback((rect: DOMRect) => {
    setActiveId(null);
    setAnchorRect(rect);
    setPanel("add");
    setAddSelectedIana(null);
    setAddNameDraft("");
    setFilter("");
    setPopoverPos(clampPopover(rect.left, rect.bottom + 6, 240, 300));
    setOpen(true);
  }, []);

  const openMenuForZone = useCallback((id: string, rect: DOMRect) => {
    setActiveId(id);
    setAnchorRect(rect);
    setPanel("menu");
    const gap = 6;
    setPopoverPos(clampPopover(rect.left, rect.bottom + gap, 200, 160));
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (cornerWrapRef.current?.contains(t) || popoverRef.current?.contains(t))
        return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const [popoverPos, setPopoverPos] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const measurePopover = useCallback(() => {
    if (!open || !anchorRect || !popoverRef.current) return;
    const el = popoverRef.current;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const left = anchorRect.left;
    let top = anchorRect.bottom + gap;
    if (top + rect.height > window.innerHeight - 8) {
      top = anchorRect.top - rect.height - gap;
    }
    const c = clampPopover(left, top, rect.width, rect.height);
    setPopoverPos(c);
  }, [open, anchorRect]);

  useLayoutEffect(() => {
    measurePopover();
  }, [
    measurePopover,
    open,
    panel,
    filter,
    addSelectedIana,
    addNameDraft,
    tick,
  ]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", measurePopover, true);
    window.addEventListener("resize", measurePopover);
    return () => {
      window.removeEventListener("scroll", measurePopover, true);
      window.removeEventListener("resize", measurePopover);
    };
  }, [open, measurePopover]);

  const patchZone = useCallback(
    (id: string, patch: Partial<CalendarAxisTimeZone>) => {
      onZonesChange(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    },
    [zones, onZonesChange],
  );

  const commitAdd = useCallback(() => {
    if (!addSelectedIana) return;
    const label = addNameDraft.trim();
    onZonesChange([
      ...zones,
      {
        id: crypto.randomUUID(),
        iana: addSelectedIana,
        label: label.length > 0 ? label : null,
      },
    ]);
    close();
  }, [addSelectedIana, addNameDraft, zones, onZonesChange, close]);

  const handleRemove = useCallback(() => {
    if (!activeId || zones.length <= 1) return;
    onZonesChange(zones.filter((z) => z.id !== activeId));
    close();
  }, [activeId, zones, onZonesChange, close]);

  const handlePickZone = useCallback(
    (iana: string) => {
      if (!activeId) return;
      patchZone(activeId, { iana, label: null });
      close();
    },
    [activeId, patchZone, close],
  );

  const applyRename = useCallback(() => {
    if (!activeId) return;
    const t = renameDraft.trim();
    patchZone(activeId, { label: t.length > 0 ? t : null });
    close();
  }, [activeId, renameDraft, patchZone, close]);

  const filteredPick = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pickChoices;
    return pickChoices.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q),
    );
  }, [pickChoices, filter]);

  const headerNow = new Date();

  const menuPanel = open && anchorRect && popoverPos && (
    <div
      ref={popoverRef}
      data-dropdown-portal
      className="fixed z-[300] flex flex-col rounded-lg border border-white/10 bg-[rgb(24,24,27)] py-1 text-xs shadow-2xl"
      style={{
        left: popoverPos.left,
        top: popoverPos.top,
        minWidth:
          panel === "pick" || panel === "add"
            ? 232
            : panel === "rename"
              ? 200
              : 168,
        maxHeight: panel === "pick" || panel === "add" ? 320 : undefined,
      }}
    >
      {panel === "menu" ? (
        <>
          <button
            type="button"
            className="px-3 py-2 text-left text-zinc-200 hover:bg-white/10"
            onClick={() => setPanel("pick")}
          >
            Change timezone
          </button>
          <button
            type="button"
            className="px-3 py-2 text-left text-zinc-200 hover:bg-white/10"
            onClick={() => {
              setRenameDraft(activeZone?.label?.trim() ?? "");
              setPanel("rename");
            }}
          >
            Rename
          </button>
          <button
            type="button"
            disabled={zones.length <= 1}
            className={cn(
              "px-3 py-2 text-left hover:bg-white/10",
              zones.length <= 1
                ? "cursor-not-allowed text-zinc-600"
                : "text-red-400",
            )}
            onClick={handleRemove}
          >
            Remove
          </button>
        </>
      ) : null}

      {panel === "pick" ? (
        <div className="flex min-h-0 flex-col gap-1 p-2">
          <button
            type="button"
            className="text-left text-[10px] text-zinc-500 hover:text-zinc-300"
            onClick={() => setPanel("menu")}
          >
            ← Back
          </button>
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search…"
            className="py-1.5 text-xs"
            maxLength={80}
          />
          <ul className="mt-1 max-h-52 overflow-auto overscroll-contain">
            {filteredPick.length === 0 ? (
              <li className="px-2 py-2 text-zinc-500">No matches</li>
            ) : (
              filteredPick.map((c) => (
                <li key={c.value}>
                  <button
                    type="button"
                    className="w-full truncate px-2 py-1.5 text-left text-zinc-200 hover:bg-white/10"
                    onClick={() => handlePickZone(c.value)}
                  >
                    {c.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {panel === "add" ? (
        <div className="flex min-h-0 flex-col gap-2 p-2">
          <div className="text-[11px] font-semibold text-zinc-200">
            Add timezone
          </div>
          <Input
            value={addNameDraft}
            onChange={(e) => setAddNameDraft(e.target.value)}
            placeholder="Optional name (e.g. EU)"
            className="py-1.5 text-xs"
            maxLength={12}
          />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search timezones…"
            className="py-1.5 text-xs"
            maxLength={80}
          />
          <ul className="max-h-44 min-h-0 overflow-auto overscroll-contain rounded-md border border-white/5">
            {filteredPick.length === 0 ? (
              <li className="px-2 py-2 text-zinc-500">No matches</li>
            ) : (
              filteredPick.map((c) => (
                <li key={c.value}>
                  <button
                    type="button"
                    className={cn(
                      "w-full truncate px-2 py-1.5 text-left text-zinc-200 hover:bg-white/10",
                      addSelectedIana === c.value && "bg-white/12",
                    )}
                    onClick={() => setAddSelectedIana(c.value)}
                  >
                    {c.label}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="flex justify-end gap-2 pt-0.5">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-zinc-400 hover:bg-white/10"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!addSelectedIana}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium",
                addSelectedIana
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "cursor-not-allowed bg-zinc-700 text-zinc-500",
              )}
              onClick={commitAdd}
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      {panel === "rename" ? (
        <div className="flex flex-col gap-2 p-2">
          <button
            type="button"
            className="text-left text-[10px] text-zinc-500 hover:text-zinc-300"
            onClick={() => setPanel("menu")}
          >
            ← Back
          </button>
          <Input
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            placeholder="Short label (e.g. EU)"
            className="py-1.5 text-xs"
            maxLength={12}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyRename();
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-zinc-400 hover:bg-white/10"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-violet-600 px-2 py-1 text-white hover:bg-violet-500"
              onClick={applyRename}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div ref={cornerWrapRef} className="tad-axis-corner">
        <button
          type="button"
          className="tad-axis-corner__add"
          title="Add timezone"
          aria-label="Add timezone"
          onClick={(e) => {
            const r = (
              e.currentTarget as HTMLButtonElement
            ).getBoundingClientRect();
            openAddPopover(r);
          }}
        >
          +
        </button>
        {zones.map((z) => (
          <button
            key={z.id}
            type="button"
            className="tad-axis-corner__tz"
            title={z.iana === AXIS_TZ_LOCAL_SENTINEL ? "This device" : z.iana}
            onClick={(e) => {
              const r = (
                e.currentTarget as HTMLButtonElement
              ).getBoundingClientRect();
              openMenuForZone(z.id, r);
            }}
          >
            {formatAxisHeaderLabel(z, headerNow)}
          </button>
        ))}
      </div>
      {typeof document !== "undefined" && menuPanel
        ? createPortal(menuPanel, document.body)
        : null}
    </>
  );
}
