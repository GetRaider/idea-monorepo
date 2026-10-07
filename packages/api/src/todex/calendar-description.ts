const SCOPE_HEADING = "# Task Scope";
const DESCRIPTION_HEADING = "# Description";

export function formatGoogleEventDescription(input: {
  taskSummaries: string[];
  description: string;
}): string {
  const summaries = input.taskSummaries
    .map((summary) => summary.trim())
    .filter((summary) => summary.length > 0);
  const description = input.description.trim();
  if (summaries.length === 0) return description;
  const scope = summaries.map((summary) => `[] ${summary}`).join("\n");
  if (!description) return `${SCOPE_HEADING}\n${scope}`;
  return `${SCOPE_HEADING}\n${scope}\n\n${DESCRIPTION_HEADING}\n${description}`;
}

export function parseGoogleEventDescription(text: string): {
  scopeLines: string[];
  description: string;
} {
  const normalized = text.replace(/\r\n/g, "\n");
  const scopeAt = normalized.indexOf(SCOPE_HEADING);
  if (scopeAt === -1) {
    return { scopeLines: [], description: normalized.trim() };
  }
  const afterScope = normalized.slice(scopeAt + SCOPE_HEADING.length);
  const descriptionAt = afterScope.indexOf(DESCRIPTION_HEADING);
  const scopeBlock =
    descriptionAt === -1 ? afterScope : afterScope.slice(0, descriptionAt);
  const description =
    descriptionAt === -1
      ? ""
      : afterScope.slice(descriptionAt + DESCRIPTION_HEADING.length).trim();
  const scopeLines = scopeBlock
    .split("\n")
    .map(checkboxLine)
    .filter((line): line is string => line != null);
  return { scopeLines, description };
}

function checkboxLine(line: string): string | null {
  const match = /^\s*\[[ xX]?\]\s*(.+)\s*$/.exec(line);
  const text = match?.[1]?.trim();
  return text ? text : null;
}
