"use client";

import { useState, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@repo/ui";
import type { Counter } from "@repo/api/todex";

import { ChevronIcon } from "@components/icons";

import { useTasks } from "../tasks-provider";
import { groupBySpace } from "./counter-helpers";
import { CounterRow } from "./counter-row";

/** Counter rows under a collapsible header per space. */
export function CounterSections({
  counters,
  renderAction,
}: {
  counters: Counter[];
  renderAction?: (counter: Counter) => ReactNode;
}) {
  const {
    state: { boards },
  } = useTasks();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  function toggle(groupId: string, open: boolean) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (open) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {groupBySpace(counters, boards).map((group) => {
        const open = !collapsed.has(group.id);
        return (
          <Collapsible
            key={group.id}
            open={open}
            onOpenChange={(next) => toggle(group.id, next)}
          >
            <CollapsibleTrigger className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ChevronIcon
                size={12}
                className={cn("text-muted-foreground", open && "rotate-90")}
              />
              {group.name}
              <span className="font-normal text-muted-foreground">
                {group.counters.length}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="flex flex-col gap-2">
                {group.counters.map((counter) => (
                  <CounterRow
                    key={counter.id}
                    counter={counter}
                    color={group.color}
                    action={renderAction?.(counter)}
                  />
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
