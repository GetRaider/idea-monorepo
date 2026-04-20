import clsx from "clsx";
import type { ComponentProps } from "react";

import { ghostButtonClass } from "./styles";

export function GhostButton({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={clsx(ghostButtonClass, className)}
      {...props}
    />
  );
}
