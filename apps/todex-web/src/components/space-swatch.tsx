export function SpaceSwatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full bg-[var(--todex-swatch)]"
      style={{ ["--todex-swatch" as string]: color }}
    />
  );
}
