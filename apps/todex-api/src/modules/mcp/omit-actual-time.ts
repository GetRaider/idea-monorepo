export function omitActualTime<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => omitActualTime(item)) as T;
  }
  if (!value || typeof value !== "object") return value;
  const record = { ...(value as Record<string, unknown>) };
  delete record.actualTime;
  for (const [key, child] of Object.entries(record)) {
    if (child && typeof child === "object") {
      record[key] = omitActualTime(child);
    }
  }
  return record as T;
}
