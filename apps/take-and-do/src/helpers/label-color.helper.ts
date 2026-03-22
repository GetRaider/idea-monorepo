export type LabelAccent = {
  dot: string;
  tintBg: string;
  tintHoverBg: string;
  tintBorder: string;
};

export function getLabelAccent(label: string): LabelAccent {
  const normalized = label.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = Math.abs(h) % 360;
  return {
    dot: `hsl(${hue}, 68%, 60%)`,
    tintBg: `hsla(${hue}, 52%, 56%, 0.16)`,
    tintHoverBg: `hsla(${hue}, 52%, 56%, 0.26)`,
    tintBorder: `hsla(${hue}, 48%, 62%, 0.38)`,
  };
}
