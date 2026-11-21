"use client";

import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import type { KnowledgeCellValue, KnowledgeProperty } from "@repo/api/todex";

export function KnowledgeCellEditor({
  value, property, disabled, onSave,
}: {
  value: KnowledgeCellValue;
  property: KnowledgeProperty;
  disabled: boolean;
  onSave: (value: KnowledgeCellValue) => void;
}) {
  const [draft, setDraft] = useState(value === null ? "" : Array.isArray(value) ? value.join(", ") : String(value));
  const before = useRef(value);
  useEffect(() => {
    before.current = value;
    setDraft(value === null ? "" : Array.isArray(value) ? value.join(", ") : String(value));
  }, [value]);

  if (property.type === "checkbox") {
    return <input type="checkbox" aria-label={property.name} className="ml-3 size-4 accent-white"
      checked={value === true} disabled={disabled} onChange={(event) => onSave(event.target.checked)} />;
  }
  if (property.type === "select") {
    return <select aria-label={property.name} className="knowledge-db-cell"
      value={typeof value === "string" ? value : ""} disabled={disabled}
      onChange={(event) => onSave(event.target.value || null)}>
      <option value="">Empty</option>
      {property.options.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>;
  }
  if (property.type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" disabled={disabled}
            className="h-9 w-full truncate px-3 text-left text-xs hover:bg-surface">
            {selected.length ? selected.join(", ") :
              <span className="text-muted-foreground">Choose…</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 bg-[#242424] p-2" sideOffset={4}>
          {property.options.length ? property.options.map((option) =>
            <label key={option} className="flex items-center gap-2 rounded px-1 py-1.5 text-xs hover:bg-surface">
              <input type="checkbox" checked={selected.includes(option)} disabled={disabled}
                onChange={(event) => onSave(event.target.checked
                  ? [...selected, option] : selected.filter((item) => item !== option))} />
              {option}
            </label>) : <span className="text-xs text-muted-foreground">Configure options first</span>}
        </PopoverContent>
      </Popover>
    );
  }

  const type = property.type === "number" ? "number" : property.type === "date" ? "date" : "text";
  function commit() {
    const next = type === "number" ? (draft.trim() === "" ? null : Number(draft))
      : (draft.trim() === "" ? null : draft);
    const prev = before.current;
    if (JSON.stringify(next) !== JSON.stringify(prev)) {
      onSave(next);
      before.current = next;
    }
  }
  return <input type={type} className="knowledge-db-cell"
    aria-label={property.name} disabled={disabled} value={draft}
    onChange={(event) => setDraft(event.target.value)}
    onBlur={commit}
    onKeyDown={(event) => {
      if (event.key === "Enter") event.currentTarget.blur();
    }}
    placeholder={property.type === "title" ? "Untitled" : ""}
  />;
}
