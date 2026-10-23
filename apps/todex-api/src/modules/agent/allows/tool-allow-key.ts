export function isWriteTool(name: string): boolean {
  return name.startsWith("create_") || name.startsWith("update_") || name.startsWith("delete_");
}

export function toolAllowKey(name: string, args: unknown): string {
  return `${name}\0${stableJson(args)}`;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    sorted[key] = sortValue(record[key]);
  }
  return sorted;
}
