import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

import { primaryButtonClass } from "./styles";

export function PrimaryLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={clsx(primaryButtonClass, className)} {...props} />;
}
