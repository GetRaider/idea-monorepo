import clsx from "clsx";
import type { ComponentProps } from "react";

import { primaryButtonClass } from "./styles";

export function PrimaryButton({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={clsx(primaryButtonClass, className)}
      {...props}
    />
  );
}
