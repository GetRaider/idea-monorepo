"use client";

import { useState, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@repo/ui";

import { ChevronIcon } from "@components/icons";

/** A titled section that starts closed; `aside` stays usable while it is. */
export function CollapsibleSection({
  title,
  count,
  aside,
  children,
}: {
  title: string;
  count: number;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex min-h-8 flex-wrap items-center gap-x-6 gap-y-2">
          <h2 className="text-sm font-medium">
            <CollapsibleTrigger className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ChevronIcon
                size={12}
                className={cn("text-muted-foreground", open && "rotate-90")}
              />
              {title}
              <span className="font-normal text-muted-foreground">{count}</span>
            </CollapsibleTrigger>
          </h2>
          {aside}
        </div>
        <CollapsibleContent>
          <div className="flex flex-col gap-2 pt-2">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
