import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

import { ghostButtonClass } from "./styles";

export function GhostLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={clsx(ghostButtonClass, className)} {...props} />;
}
