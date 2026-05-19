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

import { X } from "lucide-react";

import { Input } from "@/components/Input";
import { cn } from "@/lib/styles/utils";
import type { CalendarAxisTimeZone } from "@/types/calendar.types";

import {
  AXIS_TZ_LOCAL_SENTINEL,
  formatAxisHeaderLabel,
} from "@/helpers/calendar/calendar-axis-time";
import {
  formatDeviceTimeZoneYourLocationLabel,
  formatTimeZoneOptionLabel,
  timeZoneListIdentityKey,
  timeZoneOptions,
} from "../shared/timezones";

type PanelMode = "menu" | "pick" | "rename" | "add";

export interface CalendarAxisCornerProps {
  zones: CalendarAxisTimeZone[];
  onZonesChange: (next: CalendarAxisTimeZone[]) => void;
}

export function CalendarAxisCorner({
  zones,
  onZonesChange,
}: CalendarAxisCornerProps) {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<PanelMode>("menu");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [addSelectedIanas, setAddSelectedIanas] = useState<string[]>([]);
  const [addNameDraft, setAddNameDraft] = useState("");

  const pickChoices = useMemo(() => {
    void tick;
    void open;
    return zonePickChoices(new Date());
  }, [tick, open]);

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
    setAddSelectedIanas([]);
    setAddNameDraft("");
  }, []);

  const openAddPopover = useCallback((rect: DOMRect) => {
    setActiveId(null);
    setAnchorRect(rect);
    setPanel("add");
    setAddSelectedIanas([]);
    setAddNameDraft("");
    setFilter("");
    setPopoverPos(clampPopover(rect.left, rect.bottom + 6, 380, 320));
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

  const addSelectedIanasKey = addSelectedIanas.join("\0");

  useLayoutEffect(() => {
    measurePopover();
  }, [
    measurePopover,
    open,
    panel,
    filter,
    addSelectedIanasKey,
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
    if (addSelectedIanas.length === 0) return;
    const customLabel = addNameDraft.trim();
    const sharedLabel =
      addSelectedIanas.length === 1 && customLabel.length > 0
        ? customLabel
        : null;
    const existingIana = new Set(zones.map((z) => z.iana));
    const toAdd = addSelectedIanas.filter((iana) => !existingIana.has(iana));
    if (toAdd.length === 0) {
      close();
      return;
    }
    const newEntries: CalendarAxisTimeZone[] = toAdd.map((iana) => ({
      id: crypto.randomUUID(),
      iana,
      label: sharedLabel,
    }));
    onZonesChange([...newEntries, ...zones]);
    close();
  }, [addSelectedIanas, addNameDraft, zones, onZonesChange, close]);

  const toggleAddSelectionFromList = useCallback((iana: string) => {
    setAddSelectedIanas((prev) =>
      prev.includes(iana) ? prev.filter((x) => x !== iana) : [...prev, iana],
    );
  }, []);

  const removeFromAddSelection = useCallback((iana: string) => {
    setAddSelectedIanas((prev) => prev.filter((x) => x !== iana));
  }, []);

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

  function isPickRowSelected(value: string): boolean {
    if (!activeZone) return false;
    if (activeZone.iana === AXIS_TZ_LOCAL_SENTINEL) {
      return value === AXIS_TZ_LOCAL_SENTINEL;
    }
    if (value === AXIS_TZ_LOCAL_SENTINEL) return false;
    return (
      timeZoneListIdentityKey(value, headerNow) ===
      timeZoneListIdentityKey(activeZone.iana, headerNow)
    );
  }

  function addSelectionChipLabel(iana: string): string {
    return iana === AXIS_TZ_LOCAL_SENTINEL
      ? formatDeviceTimeZoneYourLocationLabel(headerNow)
      : formatTimeZoneOptionLabel(iana, headerNow);
  }

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
            ? 360
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
                : "text-red-500/65",
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
          {activeZone ? (
            <p className="mt-1 text-[10px] leading-snug text-zinc-500">
              Current:{" "}
              <span className="font-medium text-zinc-300">
                {activeZone.iana === AXIS_TZ_LOCAL_SENTINEL
                  ? formatDeviceTimeZoneYourLocationLabel(headerNow)
                  : formatTimeZoneOptionLabel(activeZone.iana, headerNow)}
              </span>
            </p>
          ) : null}
          <ul className="mt-1 max-h-52 overflow-auto overscroll-contain">
            {filteredPick.length === 0 ? (
              <li className="px-2 py-2 text-zinc-500">No matches</li>
            ) : (
              filteredPick.map((c) => (
                <li key={c.value}>
                  <button
                    type="button"
                    className={cn(
                      "w-full truncate rounded-md px-2 py-1.5 text-left text-zinc-200 transition-colors hover:bg-white/10",
                      isPickRowSelected(c.value) &&
                        "bg-white/[0.12] text-text-primary ring-1 ring-inset ring-white/20",
                    )}
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
            disabled={addSelectedIanas.length !== 1}
            title={
              addSelectedIanas.length !== 1
                ? "Optional name applies when exactly one timezone is selected."
                : undefined
            }
          />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search timezones…"
            className="py-1.5 text-xs"
            maxLength={80}
          />
          <div className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
            <div className="text-[10px] font-medium text-zinc-500">
              Selected:
            </div>
            {addSelectedIanas.length === 0 ? (
              <p className="mt-1 text-[11px] font-normal text-zinc-500">
                Choose timezones below.
              </p>
            ) : (
              <ul className="mt-1.5 flex max-h-28 flex-col gap-1 overflow-y-auto overscroll-contain">
                {addSelectedIanas.map((iana) => (
                  <li
                    key={iana}
                    className="flex min-h-0 items-start gap-1 rounded-md bg-white/[0.06] px-1.5 py-1"
                  >
                    <span className="min-w-0 flex-1 break-words text-[11px] font-medium leading-snug text-zinc-200">
                      {addSelectionChipLabel(iana)}
                    </span>
                    <button
                      type="button"
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/10 hover:text-text-primary"
                      aria-label={`Remove ${addSelectionChipLabel(iana)}`}
                      onClick={() => removeFromAddSelection(iana)}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul className="max-h-44 min-h-0 overflow-auto overscroll-contain rounded-md border border-white/5">
            {filteredPick.length === 0 ? (
              <li className="px-2 py-2 text-zinc-500">No matches</li>
            ) : (
              filteredPick.map((c) => (
                <li key={c.value}>
                  <button
                    type="button"
                    className={cn(
                      "w-full truncate rounded-md px-2 py-1.5 text-left text-zinc-200 transition-colors hover:bg-white/10",
                      addSelectedIanas.includes(c.value) &&
                        "bg-white/[0.12] text-text-primary ring-1 ring-inset ring-white/20",
                    )}
                    onClick={() => toggleAddSelectionFromList(c.value)}
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
              disabled={addSelectedIanas.length === 0}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium",
                addSelectedIanas.length > 0
                  ? "bg-zinc-600 text-text-primary hover:bg-zinc-500"
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
              className="rounded-md bg-zinc-600 px-2 py-1 text-text-primary hover:bg-zinc-500"
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
            title={
              z.iana === AXIS_TZ_LOCAL_SENTINEL
                ? formatDeviceTimeZoneYourLocationLabel(headerNow)
                : z.iana
            }
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

function zonePickChoices(at: Date): { value: string; label: string }[] {
  const fromIntl = timeZoneOptions().filter((o) => o.value !== "");
  return [
    {
      value: AXIS_TZ_LOCAL_SENTINEL,
      label: formatDeviceTimeZoneYourLocationLabel(at),
    },
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
