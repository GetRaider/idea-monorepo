"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner, cn } from "@repo/ui";

import { todexClient } from "@lib/todex-client";

import { formatDuration } from "./execution-time";

const BAR_COLORS = [
  "bg-orange-400",
  "bg-sky-400",
  "bg-pink-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-amber-400",
] as const;

export function ExecutionActivity() {
  const timeZone = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  )[0];
  const today = useState(() => dayKey(new Date(), timeZone))[0];
  const [preset, setPreset] = useState<RangePreset>("today");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [boardId, setBoardId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["execution", "activity", from, to, timeZone, boardId],
    queryFn: () =>
      todexClient.execution.activity({
        from,
        to,
        timeZone,
        boardId: boardId ?? undefined,
      }),
  });
  const report = query.data;
  if (report && boardId && !report.boards.some((board) => board.id === boardId)) {
    setBoardId(null);
  }
  const peak = report?.days.reduce(
    (highest, day) => Math.max(highest, day.seconds),
    0,
  );

  function applyPreset(next: RangePreset) {
    const range = presetRange(next, today);
    setPreset(next);
    setFrom(range.from);
    setTo(range.to);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "h-8 rounded-md px-3 text-sm",
                preset === item.id
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
              onClick={() => applyPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Board"
          className="h-8 rounded-md border border-border bg-transparent px-2 text-sm text-foreground outline-none"
          value={boardId ?? ""}
          onChange={(event) => setBoardId(event.target.value || null)}
        >
          <option value="">All boards</option>
          {report?.boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DateField
          label="From"
          value={from}
          onChange={(value) => {
            setPreset("custom");
            setFrom(value);
            if (value > to) setTo(value);
          }}
        />
        <DateField
          label="To"
          value={to}
          onChange={(value) => {
            setPreset("custom");
            setTo(value);
            if (value < from) setFrom(value);
          }}
        />
      </div>
      {query.isLoading ? (
        <Spinner className="py-10" />
      ) : query.isError || !report ? (
        <p className="text-sm text-muted-foreground">Could not load activity.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Execution time"
              value={formatDuration(report.executionSeconds)}
            />
            <Stat label="Sessions" value={String(report.sessionCount)} />
            <Stat
              label="Daily average"
              value={`${formatDuration(report.dailyAverageSeconds)} / day`}
            />
            <Stat
              label="Avg. session"
              value={formatDuration(report.averageSessionSeconds)}
            />
            <Stat
              label="Longest session"
              value={formatDuration(report.longestSessionSeconds)}
            />
            <Stat
              label="Active days"
              value={`${report.activeDays} / ${report.rangeDays}`}
            />
          </div>
          <section>
            <h2 className="mb-3 text-xs tracking-wide text-muted-foreground">
              Time by day
            </h2>
            <div className="flex flex-col gap-2">
              {report.days.map((day) => (
                <div
                  key={day.date}
                  className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 text-xs"
                >
                  <span className="text-muted-foreground">
                    {formatDay(day.date)}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{
                        width: `${peak ? (day.seconds / peak) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {formatDuration(day.seconds)}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-xs tracking-wide text-muted-foreground">
              Activity by board
            </h2>
            {report.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No execution in this range.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {report.activities.map((activity, index) => {
                  const share =
                    report.executionSeconds === 0
                      ? 0
                      : Math.round(
                          (activity.seconds / report.executionSeconds) * 100,
                        );
                  return (
                    <div key={activity.id} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
                      <span className="truncate">{activity.label}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-surface">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            BAR_COLORS[index % BAR_COLORS.length],
                          )}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-muted-foreground">
                        {formatDuration(activity.seconds)} {share}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs tracking-wide text-muted-foreground">
      {label}
      <input
        type="date"
        value={value}
        className="h-10 rounded-md border border-border bg-transparent px-3 text-sm text-foreground outline-none"
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-4 py-4">
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function presetRange(preset: RangePreset, today: string) {
  if (preset === "week") {
    const offset = weekdayIndex(today);
    return { from: shiftDay(today, -offset), to: shiftDay(today, 6 - offset) };
  }
  if (preset === "month") {
    const [year, month] = today.split("-");
    const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
    return {
      from: `${year}-${month}-01`,
      to: `${year}-${month}-${String(last).padStart(2, "0")}`,
    };
  }
  return { from: today, to: today };
}

function dayKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1)).toLocaleDateString(
    undefined,
    { month: "numeric", day: "numeric", timeZone: "UTC" },
  );
}

function shiftDay(day: string, delta: number) {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return utc.toISOString().slice(0, 10);
}

function weekdayIndex(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1));
  return (utc.getUTCDay() + 6) % 7;
}

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom" },
] as const;

type RangePreset = (typeof PRESETS)[number]["id"];
