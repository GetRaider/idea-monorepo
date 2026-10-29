export function estimateMicroUsd(
  model: string,
  usage: ModelUsage,
  priceJson: string | undefined,
): number | null {
  if (
    usage.inputTokens === null ||
    usage.outputTokens === null ||
    usage.webSearchCalls === null
  ) {
    return null;
  }
  const row = readPriceBook(priceJson)[model];
  if (!row) return null;
  const input = (usage.inputTokens / 1_000_000) * row.inputPerMillion * 1_000_000;
  const output = (usage.outputTokens / 1_000_000) * row.outputPerMillion * 1_000_000;
  const search = usage.webSearchCalls * row.webSearchPerCall * 1_000_000;
  return Math.round(input + output + search);
}

export function hasPriceRow(model: string, priceJson: string | undefined): boolean {
  return Boolean(readPriceBook(priceJson)[model]);
}

function readPriceBook(priceJson: string | undefined): Record<string, PriceRow> {
  if (!priceJson?.trim()) return {};
  try {
    const parsed = JSON.parse(priceJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const book: Record<string, PriceRow> = {};
    for (const [model, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      if (
        typeof row.inputPerMillion !== "number" ||
        typeof row.outputPerMillion !== "number" ||
        typeof row.webSearchPerCall !== "number"
      ) {
        continue;
      }
      book[model] = {
        inputPerMillion: row.inputPerMillion,
        outputPerMillion: row.outputPerMillion,
        webSearchPerCall: row.webSearchPerCall,
      };
    }
    return book;
  } catch {
    return {};
  }
}

export interface ModelUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  webSearchCalls: number | null;
}

interface PriceRow {
  inputPerMillion: number;
  outputPerMillion: number;
  webSearchPerCall: number;
}
