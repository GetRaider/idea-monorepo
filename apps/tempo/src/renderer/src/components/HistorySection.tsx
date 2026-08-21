import { useMemo, useState } from "react";

import {
  buildHistoryEntries,
  filterRecordsByStartedAtRange,
  findCompletedRecord,
  parseDatetimeLocalValue,
  resolveRecordColor,
} from "../../../helpers/history.helper";
import { Field, FieldLabel, TextInput } from "../App.styles";

import {
  EmptyHistory,
  HistoryActions,
  HistoryButton,
  HistoryColorDot,
  HistoryDetail,
  HistoryFilters,
  HistoryList,
  HistoryMeta,
  HistoryName,
  HistoryRow,
  HistoryText,
  ManualBadge,
  ModeBadge,
} from "./HistorySection.styles";
import { OverflowMenu } from "./OverflowMenu";

import type { FocusRecord, SavedSession } from "../../../shared/records.types";

export function HistorySection({
  records,
  sessions,
  onEdit,
  onDelete,
}: HistorySectionProps) {
  const [rangeStartValue, setRangeStartValue] = useState("");
  const [rangeEndValue, setRangeEndValue] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const sessionColorById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session.color])),
    [sessions],
  );
  const filteredRecords = useMemo(
    () =>
      filterRecordsByStartedAtRange(
        records,
        parseDatetimeLocalValue(rangeStartValue),
        parseDatetimeLocalValue(rangeEndValue),
      ),
    [records, rangeStartValue, rangeEndValue],
  );
  const historyEntries = buildHistoryEntries(filteredRecords);
  const hasDateFilter =
    rangeStartValue.trim().length > 0 || rangeEndValue.trim().length > 0;

  return (
    <>
      <HistoryFilters>
        <Field>
          <FieldLabel>From</FieldLabel>
          <TextInput
            type="datetime-local"
            value={rangeStartValue}
            onChange={(event) => setRangeStartValue(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>To</FieldLabel>
          <TextInput
            type="datetime-local"
            value={rangeEndValue}
            onChange={(event) => setRangeEndValue(event.target.value)}
          />
        </Field>
      </HistoryFilters>
      {historyEntries.length === 0 ? (
        <EmptyHistory>
          {hasDateFilter ? "No records in this range." : "No records yet."}
        </EmptyHistory>
      ) : (
        <HistoryList>
          {historyEntries.map((entry) => {
            const record = findCompletedRecord(filteredRecords, entry.id);
            const isConfirmingDelete = pendingDeleteId === entry.id;
            const recordColor =
              record === null
                ? null
                : resolveRecordColor(record, sessionColorById);

            return (
              <HistoryRow key={entry.id}>
                <HistoryMeta>
                  {recordColor !== null ? (
                    <HistoryColorDot $color={recordColor} aria-hidden />
                  ) : null}
                  <HistoryText>
                    <HistoryName>{entry.title}</HistoryName>
                    <HistoryDetail>{entry.detail}</HistoryDetail>
                  </HistoryText>
                </HistoryMeta>
                <HistoryActions>
                  <ModeBadge>
                    {entry.mode === "timer" ? "Timer" : "Stopwatch"}
                  </ModeBadge>
                  {entry.hasManual ? <ManualBadge>Manual</ManualBadge> : null}
                  {isConfirmingDelete ? (
                    <>
                      <HistoryButton
                        type="button"
                        $danger
                        onClick={() => {
                          void onDelete(entry.id);
                          setPendingDeleteId(null);
                        }}
                      >
                        Confirm
                      </HistoryButton>
                      <HistoryButton
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                      >
                        Cancel
                      </HistoryButton>
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
                </HistoryActions>
              </HistoryRow>
            );
          })}
        </HistoryList>
      )}
    </>
  );
}

interface HistorySectionProps {
  records: FocusRecord[];
  sessions: SavedSession[];
  onEdit: (record: FocusRecord) => void;
  onDelete: (recordId: string) => Promise<void>;
}
