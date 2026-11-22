export const UNTITLED = "Untitled";

export function singleLineTitle(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, " ");
}

// New docs are created as "Untitled"; show that as the placeholder, and save an
// empty title back as "Untitled" since the API requires one.
export function titleForEditing(title: string): string {
  return title === UNTITLED ? "" : title;
}

export function titleForSaving(title: string): string {
  return singleLineTitle(title).trim() || UNTITLED;
}
