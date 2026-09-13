import { useMemo, useState, type CSSProperties } from "react";

import {
  buildHistoryDayGroups,
  buildHistoryEntries,
  buildActivityFilterOptions,
  findCompletedRecord,
  resolveRecordColor,
} from "../../../helpers/history.helper";
import {
  getAnalyticsDataset,
  resolveAnalyticsPeriod,
  type AnalyticsPeriodPreset,
} from "../../../helpers/analytics.helper";

import { OverflowMenu } from "./OverflowMenu";
import { PeriodFilter } from "./PeriodFilter";
import { Button } from "./ui/button";

import type { FocusRecord, SavedSession } from "../../../shared/records.types";

export function HistorySection({
  records,
  sessions,
  onEdit,
  onDelete,
  onAdd,
}: HistorySectionProps) {
  const [periodPreset, setPeriodPreset] =
    useState<AnalyticsPeriodPreset>("week");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const sessionColorById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session.color])),
    [sessions],
  );
  const filterOptions = useMemo(
    () => buildActivityFilterOptions(sessions),
    [sessions],
  );
  const period = useMemo(
    () =>
      resolveAnalyticsPeriod(
        periodPreset,
        new Date(),
        periodPreset === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : null,
      ),
    [periodPreset, customStartDate, customEndDate],
  );
  const dataset = useMemo(
    () => getAnalyticsDataset(records, period, selectedActivityId || null),
    [records, period, selectedActivityId],
  );
  const historyEntries = buildHistoryEntries(dataset);
  const dayGroups = buildHistoryDayGroups(historyEntries);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-medium">History</h1>
        <Button variant="ghost" onClick={onAdd}>
          Add record
        </Button>
      </div>
      <PeriodFilter
        periodPreset={periodPreset}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        activityId={selectedActivityId}
        activityOptions={filterOptions}
        onPeriodChange={setPeriodPreset}
        onCustomStartChange={setCustomStartDate}
        onCustomEndChange={setCustomEndDate}
        onActivityChange={setSelectedActivityId}
      />
      {historyEntries.length === 0 ? (
        <p className="m-0 text-sm text-tempo-muted">
          {period === null
            ? "Pick a custom date range."
            : records.length === 0
              ? "No records yet."
              : "No records in this range."}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {dayGroups.map((group) => (
            <section key={group.dayKey} className="flex flex-col gap-2">
              <h2 className="m-0 text-xs font-medium uppercase tracking-wide text-tempo-muted">
                {group.heading}
              </h2>
              {group.entries.map((entry) => {
                const record = findCompletedRecord(dataset, entry.id);
                const isConfirmingDelete = pendingDeleteId === entry.id;
                const recordColor =
                  record === null
                    ? null
                    : resolveRecordColor(record, sessionColorById);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-tempo-line px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {recordColor !== null ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-[var(--history-dot)]"
                          style={
                            {
                              "--history-dot": recordColor,
                            } as CSSProperties
                          }
                          aria-hidden
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm">{entry.title}</p>
                        <p className="m-0 text-xs text-tempo-muted">
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {entry.recordRole === "break" ? (
                        <span className="rounded-md border border-tempo-line px-2 py-0.5 text-[11px] text-tempo-muted">
                          Break
                        </span>
                      ) : null}
                      {entry.hasManual ? (
                        <span className="rounded-md border border-tempo-line px-2 py-0.5 text-[11px] text-tempo-muted">
                          Manual
                        </span>
                      ) : null}
                      {isConfirmingDelete ? (
                        <>
                          <button
                            type="button"
                            className="cursor-pointer border-0 bg-transparent text-xs text-tempo-danger"
                            onClick={() => {
                              void onDelete(entry.id);
                              setPendingDeleteId(null);
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer border-0 bg-transparent text-xs text-tempo-muted"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <OverflowMenu
                          items={[
                            {
                              label: "Edit",
                              disabled: record === null,
                              onSelect: () => {
                                if (record !== null) {
                                  onEdit(record);
                                }
                              },
                            },
                            {
                              label: "Delete",
                              danger: true,
                              onSelect: () => setPendingDeleteId(entry.id),
                            },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

interface HistorySectionProps {
  records: FocusRecord[];
  sessions: SavedSession[];
  onEdit: (record: FocusRecord) => void;
  onDelete: (recordId: string) => Promise<void>;
  onAdd: () => void;
}
