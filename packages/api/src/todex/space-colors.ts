import { z } from "zod";

export const SPACE_COLORS = [
  "#B8A4D1",
  "#AD8570",
  "#93B7CC",
  "#A1B6A1",
  "#C9A2AD",
  "#CEBD8C",
  "#8FBAB5",
  "#A5A9B0",
] as const;

export const DEFAULT_SPACE_COLOR = SPACE_COLORS[0];

export const SpaceColorSchema = z.enum(SPACE_COLORS);

export type SpaceColor = z.infer<typeof SpaceColorSchema>;
