const CHUNK_SIZE = 800;

export function splitText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const chunks: string[] = [];
  let rest = trimmed;
  while (rest.length > CHUNK_SIZE) {
    const breakAt = rest.lastIndexOf("\n", CHUNK_SIZE);
    const cut = breakAt >= CHUNK_SIZE / 2 ? breakAt : CHUNK_SIZE;
    const piece = rest.slice(0, cut).trim();
    if (piece) chunks.push(piece);
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
