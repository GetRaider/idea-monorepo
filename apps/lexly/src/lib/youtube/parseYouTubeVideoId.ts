export function parseYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const pathname = url.pathname.replace(/^\//, "");
      return pathname ? pathname : null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const v = url.searchParams.get("v");
      return v ? v : null;
    }
  } catch {
    // Fall back to a bare id.
  }

  const bareMatch = trimmed.match(/^[a-zA-Z0-9_-]{11}$/);
  return bareMatch ? bareMatch[0] : null;
}

