import type {
  KnowledgeCellValue,
  KnowledgeDatabase,
  KnowledgeFilterSchema,
} from "@repo/api/todex";

type Row = KnowledgeDatabase["rows"][number];
type Filter = KnowledgeDatabase["view"]["filters"][number];

function isEmpty(value: KnowledgeCellValue | undefined): boolean {
  return value === undefined || value === null || value === "" ||
    (Array.isArray(value) && value.length === 0);
}

function textValue(value: KnowledgeCellValue | undefined): string {
  if (value === null || value === undefined) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function compare(a: KnowledgeCellValue | undefined, b: KnowledgeCellValue | undefined) {
  if (isEmpty(a) && isEmpty(b)) return 0;
  if (isEmpty(a)) return 1;
  if (isEmpty(b)) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return textValue(a).localeCompare(textValue(b), undefined, {
    sensitivity: "base", numeric: true,
  });
}

function matches(row: Row, filter: Filter): boolean {
  const value = row.cells[filter.propertyId];
  if (filter.operator === "is_empty") return isEmpty(value);
  if (filter.operator === "not_empty") return !isEmpty(value);
  const query = filter.value;
  if (query === undefined) return true;
  switch (filter.operator) {
    case "contains":
      return textValue(value).toLowerCase().includes(textValue(query).toLowerCase());
    case "equals":
      return Array.isArray(value) && typeof query === "string"
        ? value.includes(query)
        : JSON.stringify(value ?? null) === JSON.stringify(query);
    case "not_equals":
      return Array.isArray(value) && typeof query === "string"
        ? !value.includes(query)
        : JSON.stringify(value ?? null) !== JSON.stringify(query);
    case "greater_than":
      return !isEmpty(value) && compare(value, query) > 0;
    case "less_than":
      return !isEmpty(value) && compare(value, query) < 0;
    default:
      return true;
  }
}

export function visibleKnowledgeRows(data: KnowledgeDatabase): Row[] {
  const filtered = data.rows.filter((row) =>
    data.view.filters.every((filter) => matches(row, filter)),
  );
  return [...filtered].sort((a, b) => {
    for (const sort of data.view.sorts) {
      const diff = compare(a.cells[sort.propertyId], b.cells[sort.propertyId]);
      if (diff) return diff * (sort.direction === "asc" ? 1 : -1);
    }
    return a.position - b.position;
  });
}
