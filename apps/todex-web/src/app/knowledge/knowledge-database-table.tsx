"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import type {
  KnowledgeCellValue,
  KnowledgeDatabase,
  KnowledgeProperty,
  KnowledgePropertyType,
} from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";
import { visibleKnowledgeRows } from "./knowledge-database-view";

const PROPERTY_TYPES: Exclude<KnowledgePropertyType, "title">[] = [
  "text", "number", "select", "multi_select", "date", "checkbox",
];

function displayType(type: KnowledgePropertyType) {
  return type === "multi_select" ? "Multi-select" : type.charAt(0).toUpperCase() + type.slice(1);
}

function valueForFilter(property: KnowledgeProperty | undefined, input: string): KnowledgeCellValue {
  if (!property) return input;
  if (property.type === "number") return input.trim() === "" ? null : Number(input);
  if (property.type === "checkbox") return input === "true";
  return input;
}

export function KnowledgeDatabaseTable({ databaseId }: { databaseId: string }) {
  const queryClient = useQueryClient();
  const key = ["knowledge-database", databaseId];
  const query = useQuery({ queryKey: key,
    queryFn: () => todexClient.knowledgeDatabases.get(databaseId),
  });
  const mutation = useMutation({
    mutationFn: (perform: () => Promise<KnowledgeDatabase>) => perform(),
    onSuccess: (value) => queryClient.setQueryData(key, value),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't save database"),
  });

  const [addingProperty, setAddingProperty] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Exclude<KnowledgePropertyType, "title">>("text");
  const [newOptions, setNewOptions] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPropertyId, setFilterPropertyId] = useState("");
  const [filterOperator, setFilterOperator] = useState<KnowledgeDatabase["view"]["filters"][number]["operator"]>("contains");
  const [filterValue, setFilterValue] = useState("");
  const data = query.data;
  const [databaseName, setDatabaseName] = useState("");
  useEffect(() => setDatabaseName(data?.name ?? ""), [data?.name]);
  const rows = useMemo(() => data ? visibleKnowledgeRows(data) : [], [data]);
  const busy = mutation.isPending;
  const run = (perform: () => Promise<KnowledgeDatabase>) => mutation.mutate(perform);

  if (query.isLoading) {
    return <div className="knowledge-db-shell p-4 text-sm text-muted-foreground">Loading database…</div>;
  }
  if (query.isError || !data) {
    return (
      <div className="knowledge-db-shell p-4 text-sm">
        <p className="text-muted-foreground">Database unavailable or access denied.</p>
        <button type="button" onClick={() => void query.refetch()}
          className="mt-2 underline">Retry</button>
      </div>
    );
  }

  const selectProperty = data.properties.find((p) => p.id === filterPropertyId) ??
    data.properties[0];

  function addProperty() {
    const name = newName.trim();
    if (!name) return;
    const options = (newType === "select" || newType === "multi_select")
      ? newOptions.split(",").map((s) => s.trim()).filter(Boolean) : [];
    run(() => todexClient.knowledgeDatabases.addProperty(databaseId, {
      name, type: newType, options,
    }));
    setNewName("");
    setNewOptions("");
    setAddingProperty(false);
  }

  function addFilter() {
    if (!selectProperty) return;
    const value = valueForFilter(selectProperty, filterValue);
    if (selectProperty.type === "number" && value !== null &&
        typeof value === "number" && !Number.isFinite(value)) {
      toast.error("Filter value must be a number");
      return;
    }
    const filter = {
      propertyId: selectProperty.id,
      operator: filterOperator,
      ...(filterOperator === "is_empty" || filterOperator === "not_empty"
        ? {} : { value }),
    };
    run(() => todexClient.knowledgeDatabases.updateView(databaseId, {
      filters: [...data.view.filters, filter],
    }));
    setFilterOpen(false);
    setFilterValue("");
  }

  return (
    <div className="knowledge-db-shell my-6 rounded-xl border border-border bg-[#171717] text-sm"
      onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="text-muted-foreground">▦</span>
          <input aria-label="Database name" className="min-w-32 max-w-56 truncate rounded bg-transparent px-1 py-1 font-semibold outline-none focus:bg-[#292929]"
            value={databaseName} disabled={busy}
            onChange={(event) => setDatabaseName(event.target.value)}
            onBlur={() => {
              if (databaseName.trim() && databaseName.trim() !== data.name) {
                run(() => todexClient.knowledgeDatabases.rename(databaseId, { name: databaseName.trim() }));
              } else setDatabaseName(data.name);
            }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
          <span className="text-xs text-muted-foreground">Table · {data.rows.length} rows</span>
          {busy ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" disabled={busy} onClick={() => setFilterOpen((open) => !open)}
            className="knowledge-db-action">Filter{data.view.filters.length ? ` (${data.view.filters.length})` : ""}</button>
          <button type="button" disabled={busy} onClick={() => run(() => todexClient.knowledgeDatabases.updateView(databaseId, {
            filters: [], sorts: [],
          }))} className="knowledge-db-action">Clear view</button>
          <button type="button" disabled={busy} onClick={() => run(() => todexClient.knowledgeDatabases.addRow(databaseId))}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-85">+ New</button>
        </div>
      </div>

      {data.view.sorts.length > 0 || data.view.filters.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
          {data.view.sorts.map((sort, i) => {
            const property = data.properties.find((p) => p.id === sort.propertyId);
            return (
              <button key={i} type="button" disabled={busy}
                onClick={() => run(() => todexClient.knowledgeDatabases.updateView(databaseId, {
                  sorts: data.view.sorts.filter((_, index) => index !== i),
                }))}
                className="knowledge-db-pill">Sort: {property?.name ?? "Property"} {sort.direction === "asc" ? "↑" : "↓"} ×</button>
            );
          })}
          {data.view.filters.map((filter, i) => {
            const property = data.properties.find((p) => p.id === filter.propertyId);
            return (
              <button key={i} type="button" disabled={busy}
                onClick={() => run(() => todexClient.knowledgeDatabases.updateView(databaseId, {
                  filters: data.view.filters.filter((_, index) => index !== i),
                }))}
                className="knowledge-db-pill">{property?.name ?? "Property"} {filter.operator.replaceAll("_", " ")} {filter.value === undefined ? "" : String(filter.value)} ×</button>
            );
          })}
        </div>
      ) : null}

      {filterOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3">
          <select aria-label="Filter property" className="knowledge-db-input" value={selectProperty?.id ?? ""}
            onChange={(event) => setFilterPropertyId(event.target.value)}>
            {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select aria-label="Filter operator" className="knowledge-db-input" value={filterOperator}
            onChange={(event) => setFilterOperator(event.target.value as typeof filterOperator)}>
            {["contains", "equals", "not_equals", "is_empty", "not_empty", "greater_than", "less_than"].map((op) =>
              <option key={op} value={op}>{op.replaceAll("_", " ")}</option>)}
          </select>
          {filterOperator !== "is_empty" && filterOperator !== "not_empty" ? (
            selectProperty?.type === "checkbox" ? (
              <select className="knowledge-db-input" aria-label="Filter value" value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}>
                <option value="">Choose…</option><option value="true">Checked</option><option value="false">Unchecked</option>
              </select>
            ) : (
              <input className="knowledge-db-input" aria-label="Filter value"
                type={selectProperty?.type === "number" ? "number" : selectProperty?.type === "date" ? "date" : "text"}
                value={filterValue} placeholder="Value…" onChange={(event) => setFilterValue(event.target.value)} />
            )
          ) : null}
          <button type="button" disabled={busy} onClick={addFilter} className="knowledge-db-action">Apply filter</button>
          <button type="button" onClick={() => setFilterOpen(false)} className="knowledge-db-action">Cancel</button>
        </div>
      ) : null}

      <div className="w-full overflow-x-auto">
        <table className="knowledge-db-grid w-full min-w-[480px] table-fixed border-collapse text-left">
          <thead><tr>
            {data.properties.map((property) => (
              <th key={property.id} scope="col" className="relative min-w-[150px] border-b border-r border-border bg-[#1c1c1c] p-0 align-middle last:border-r-0">
                <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                  <span className="min-w-0 truncate text-xs font-medium text-[#dedede]">
                    <span className="mr-1.5 text-muted-foreground">{property.type === "title" ? "Aa" : property.type === "checkbox" ? "☑" : property.type === "date" ? "▦" : property.type === "number" ? "#" : property.type === "select" ? "◉" : "≡"}</span>
                    {property.name}
                  </span>
                  <PropertyMenu property={property} database={data} busy={busy} run={run}/>
                </div>
              </th>
            ))}
            <th scope="col" className="w-12 border-b border-border bg-[#1c1c1c]">
              <button type="button" aria-label="Add property" title="Add property"
                onClick={() => setAddingProperty(true)} className="w-full py-2 text-muted-foreground hover:text-foreground">+</button>
            </th>
          </tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="group/row hover:bg-[#202020]">
                {data.properties.map((property) => (
                  <td key={property.id} className="h-10 border-b border-r border-border p-0 last:border-r-0">
                    <KnowledgeCellEditor
                      value={row.cells[property.id] ?? null}
                      property={property}
                      disabled={busy}
                      onSave={(value) => run(() => todexClient.knowledgeDatabases.patchCell(databaseId, row.id, {
                        propertyId: property.id, value,
                      }))}
                    />
                  </td>
                ))}
                <td className="border-b border-border text-center">
                  <button type="button" aria-label="Remove row" title="Remove row" disabled={busy}
                    onClick={() => {
                      if (window.confirm("Delete this database row?")) {
                        run(() => todexClient.knowledgeDatabases.deleteRow(databaseId, row.id));
                      }
                    }} className="opacity-0 text-muted-foreground group-hover/row:opacity-100 hover:text-foreground focus:opacity-100">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-3 py-4 text-xs text-muted-foreground">
          {data.rows.length ? "No rows match this view." : "No records yet. Add a row to start."}
        </p> : null}
      </div>
      {addingProperty ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-3">
          <input autoFocus aria-label="New property name" className="knowledge-db-input"
            value={newName} placeholder="Property name" onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") addProperty(); }} />
          <select aria-label="New property type" className="knowledge-db-input" value={newType}
            onChange={(event) => setNewType(event.target.value as typeof newType)}>
            {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{displayType(type)}</option>)}
          </select>
          {newType === "select" || newType === "multi_select" ? (
            <input aria-label="Selection options" className="knowledge-db-input" value={newOptions}
              placeholder="Options: A, B, C" onChange={(event) => setNewOptions(event.target.value)}/>
          ) : null}
          <button type="button" className="knowledge-db-action" disabled={busy || !newName.trim()} onClick={addProperty}>Add</button>
          <button type="button" className="knowledge-db-action" onClick={() => setAddingProperty(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => run(() => todexClient.knowledgeDatabases.addRow(databaseId))}
          disabled={busy} className="w-full border-t border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-[#202020] hover:text-foreground">
          + New row
        </button>
      )}
    </div>
  );
}

function PropertyMenu({
  property, database, busy, run,
}: {
  property: KnowledgeProperty;
  database: KnowledgeDatabase;
  busy: boolean;
  run: (perform: () => Promise<KnowledgeDatabase>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(property.name);
  const [options, setOptions] = useState(property.options.join(", "));
  useEffect(() => setName(property.name), [property.name]);
  useEffect(() => setOptions(property.options.join(", ")), [property.options]);
  const id = database.id;
  const canChange = property.type !== "title";

  function saveSettings() {
    const nextOptions = options.split(",").map((option) => option.trim()).filter(Boolean);
    if (!name.trim()) return;
    run(() => todexClient.knowledgeDatabases.updateProperty(id, property.id, {
      name: name.trim(),
      ...(property.type === "select" || property.type === "multi_select"
        ? { options: nextOptions } : {}),
    }));
    setOpen(false);
  }

  function sort(direction: "asc" | "desc") {
    run(() => todexClient.knowledgeDatabases.updateView(id, {
      sorts: [{ propertyId: property.id, direction }],
    }));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title={`Configure ${property.name}`}
          aria-label={`Configure ${property.name}`}
          className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:bg-surface hover:text-foreground">
          •••
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 bg-[#242424] p-2" sideOffset={4}>
        <label className="block text-xs text-muted-foreground">Property name</label>
        <input className="knowledge-db-input my-1 w-full" value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") saveSettings(); }}/>
        {canChange && (property.type === "select" || property.type === "multi_select") ? (
          <>
            <label className="block text-xs text-muted-foreground">Options (comma-separated)</label>
            <input className="knowledge-db-input my-1 w-full" value={options}
              onChange={(event) => setOptions(event.target.value)}/>
          </>
        ) : null}
        <button type="button" disabled={busy || !name.trim()} onClick={saveSettings}
          className="knowledge-db-menu-action">Save property</button>
        {canChange ? (
          <>
            <label className="mt-2 block text-xs text-muted-foreground">Change type (empty cells only)</label>
            <select className="knowledge-db-input my-1 w-full" value={property.type}
              disabled={busy} onChange={(event) => {
                setOpen(false);
                run(() => todexClient.knowledgeDatabases.updateProperty(id, property.id, {
                  type: event.target.value as Exclude<KnowledgePropertyType, "title">,
                }));
              }}>
              {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{displayType(type)}</option>)}
            </select>
          </>
        ) : null}
        <div className="my-2 border-t border-border" />
        <button type="button" disabled={busy}
          className="knowledge-db-menu-action" onClick={() => sort("asc")}>Sort ascending ↑</button>
        <button type="button" disabled={busy}
          className="knowledge-db-menu-action" onClick={() => sort("desc")}>Sort descending ↓</button>
        {canChange ? (
          <button type="button" disabled={busy}
            className="knowledge-db-menu-action text-[#e4aaaa]"
            onClick={() => {
              if (window.confirm(`Delete property "${property.name}" and all its values?`)) {
                run(() => todexClient.knowledgeDatabases.deleteProperty(id, property.id));
                setOpen(false);
              }
            }}>Delete property</button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function KnowledgeCellEditor({
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
