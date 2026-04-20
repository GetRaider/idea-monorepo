import clsx from "clsx";
import type { ComponentProps } from "react";

import { outlinedButtonClass } from "./styles";

export function OutlinedButton({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={clsx(outlinedButtonClass, className)}
      {...props}
    />
  );
}
