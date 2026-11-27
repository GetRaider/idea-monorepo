"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import type { CounterDetail } from "@repo/api/todex";

import { CloseIcon, InfoIcon, PlusIcon, RepeatIcon } from "@components/icons";

import { useTasks } from "../tasks-provider";
import { CollapsibleSection } from "./collapsible-section";
import { TaskAutocomplete } from "./task-autocomplete";
import { useCounterActions } from "./use-counters";

const ANY_TASK_EXPLANATION =
  "Completing any task in the linked spaces counts toward this counter.";

/** Which completed Tasks count: linked spaces, then all of theirs or a pick. */
export function CounterLinks({ counter }: { counter: CounterDetail }) {
  const { update } = useCounterActions(counter.id);
  const hasSpaces = counter.spaceIds.length > 0;

  return (
    <CollapsibleSection title="Links" count={counter.spaceIds.length}>
      <LinkedSpaces counter={counter} />
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <Switch
            checked={counter.countsAnyTask}
            disabled={!hasSpaces || update.isPending}
            onCheckedChange={(countsAnyTask) =>
              update.mutate({ countsAnyTask })
            }
            aria-label="Any task counts"
          />
          Any task counts
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`About Any task counts: ${ANY_TASK_EXPLANATION}`}
              className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <InfoIcon size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{ANY_TASK_EXPLANATION}</TooltipContent>
        </Tooltip>
      </div>
      {counter.countsAnyTask ? null : <PickedTasks counter={counter} />}
    </CollapsibleSection>
  );
}

function LinkedSpaces({ counter }: { counter: CounterDetail }) {
  const {
    state: { boards },
  } = useTasks();
  const { update } = useCounterActions(counter.id);
  const linked = boards.filter((board) => counter.spaceIds.includes(board.id));
  const available = boards.filter(
    (board) => !counter.spaceIds.includes(board.id),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Spaces</span>
      <ul className="contents">
        {linked.map((space) => (
          <li
            key={space.id}
            className="flex items-center gap-2 rounded-full border border-border py-1 pl-3 pr-1 text-sm"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[var(--space-color)]"
              style={{ ["--space-color" as string]: space.color }}
            />
            {space.name}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full text-muted-foreground"
              aria-label={`Unlink ${space.name}`}
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  spaceIds: counter.spaceIds.filter((id) => id !== space.id),
                })
              }
            >
              <CloseIcon size={12} />
            </Button>
          </li>
        ))}
      </ul>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={available.length === 0 || update.isPending}
          >
            <PlusIcon size={14} />
            Add space
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {available.map((space) => (
            <DropdownMenuItem
              key={space.id}
              onSelect={() =>
                update.mutate({
                  spaceIds: [...counter.spaceIds, space.id],
                })
              }
            >
              {space.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PickedTasks({ counter }: { counter: CounterDetail }) {
  const { removeLink } = useCounterActions(counter.id);

  return (
    <>
      <TaskAutocomplete counter={counter} />
      {counter.links.length > 0 ? (
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
      ) : null}
    </>
  );
}
