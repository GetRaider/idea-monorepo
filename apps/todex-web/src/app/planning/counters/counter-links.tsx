"use client";

import {
  Button,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import type { CounterDetail } from "@repo/api/todex";

import { CloseIcon, InfoIcon, RepeatIcon } from "@components/icons";

import { useTasks } from "../tasks-provider";
import { CollapsibleSection } from "./collapsible-section";
import { TaskAutocomplete } from "./task-autocomplete";
import { useCounterActions } from "./use-counters";

export function CounterLinks({ counter }: { counter: CounterDetail }) {
  const { removeLink } = useCounterActions(counter.id);

  return (
    <CollapsibleSection
      title="Linked tasks"
      count={counter.links.length}
      aside={<LinkToSpace counter={counter} />}
    >
      <TaskAutocomplete counter={counter} />
      {counter.links.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Link a task and completing it counts here.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {counter.links.map((link) => (
            <li key={link.id} className="flex items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {link.title}
              </span>
              {link.kind === "series" ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RepeatIcon size={12} />
                  Repeating
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {link.taskKey}
                </span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                aria-label={`Unlink ${link.title}`}
                disabled={removeLink.isPending}
                onClick={() => removeLink.mutate(link.id)}
              >
                <CloseIcon size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

function LinkToSpace({ counter }: { counter: CounterDetail }) {
  const { update } = useCounterActions(counter.id);
  const {
    state: { boards },
  } = useTasks();
  const space = boards.find((board) => board.id === counter.spaceId);
  const explanation = space
    ? `Completing any task in ${space.name} counts for this counter.`
    : "Pick a space in Edit to count its completed tasks here.";

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        <Switch
          checked={counter.countsSpaceTasks}
          disabled={!space || update.isPending}
          onCheckedChange={(countsSpaceTasks) =>
            update.mutate({ countsSpaceTasks })
          }
          aria-label="Link to Space"
        />
        Link to Space
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About Link to Space: ${explanation}`}
            className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <InfoIcon size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{explanation}</TooltipContent>
      </Tooltip>
    </div>
  );
}
