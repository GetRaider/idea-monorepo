import type { ComponentProps } from "react";

export type UiProps<T extends keyof JSX.IntrinsicElements> = ComponentProps<T>;
