"use client";

import type { ReactNode } from "react";
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
  cn,
} from "@repo/ui";
import type { CounterDetail } from "@repo/api/todex";

import { CloseIcon, InfoIcon, PlusIcon, RepeatIcon } from "@components/icons";

import { useTasks } from "../tasks-provider";
import { CollapsibleSection } from "./collapsible-section";
import { joinNames } from "./counter-helpers";
import { SpaceDot } from "./space-dot";
import { TaskAutocomplete } from "./task-autocomplete";
import { useCounterActions } from "./use-counters";

const ANY_TASK_EXPLANATION =
  "Completing any task in the linked spaces counts toward this counter.";

/** Which completed Tasks count: linked spaces, then all of theirs or a pick. */
export function CounterLinks({ counter }: { counter: CounterDetail }) {
  return (
    <CollapsibleSection title="Links" count={counter.spaceIds.length}>
      <div className="overflow-hidden rounded-2xl border border-border bg-white/[0.02]">
        {/* Each side draws its top and left edge; the outer ones are clipped,
            which leaves one divider whether the sides sit abreast or stack. */}
        <div className="-ml-px -mt-px flex flex-wrap">
          <LinksColumn className="flex-[1_1_22rem]">
            <LinkedSpaces counter={counter} />
          </LinksColumn>
          <LinksColumn className="flex-[999_1_22rem]">
            <LinkedTasks counter={counter} />
          </LinksColumn>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function LinksColumn({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 border-l border-t border-border p-4",
        className,
      )}
    >
      {children}
    </div>
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
    <>
      <h3 className={HEADING}>Spaces</h3>
      {linked.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {linked.map((space) => (
            <li key={space.id} className={ITEM}>
              <SpaceDot color={space.color} />
              <span className="min-w-0 flex-1 truncate text-sm">
                {space.name}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className={REMOVE}
                aria-label={`Unlink ${space.name}`}
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    spaceIds: counter.spaceIds.filter((id) => id !== space.id),
                  })
                }
              >
                <CloseIcon size={14} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Link a space to count its tasks here.
        </p>
      )}
      {available.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="justify-start border border-dashed border-border text-muted-foreground"
              disabled={update.isPending}
            >
              <PlusIcon size={14} />
              Add space
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            {available.map((space) => (
              <DropdownMenuItem
                key={space.id}
                onSelect={() =>
                  update.mutate({
                    spaceIds: [...counter.spaceIds, space.id],
                  })
                }
              >
                <SpaceDot color={space.color} />
                {space.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </>
  );
}

function LinkedTasks({ counter }: { counter: CounterDetail }) {
  const {
    state: { boards },
  } = useTasks();
  const { update } = useCounterActions(counter.id);
  const spaceNames = boards
    .filter((board) => counter.spaceIds.includes(board.id))
    .map((board) => board.name);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={HEADING}>Tasks</h3>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="counter-any-task">Any task counts</label>
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
          <Switch
            id="counter-any-task"
            checked={counter.countsAnyTask}
            disabled={counter.spaceIds.length === 0 || update.isPending}
            onCheckedChange={(countsAnyTask) =>
              update.mutate({ countsAnyTask })
            }
          />
        </div>
      </div>
      {counter.countsAnyTask ? (
        <p className={NOTICE}>
          Every completed task in {joinNames(spaceNames)} counts.
        </p>
      ) : (
        <PickedTasks counter={counter} />
      )}
    </>
  );
}

function PickedTasks({ counter }: { counter: CounterDetail }) {
  const {
    state: { boards },
  } = useTasks();
  const { removeLink } = useCounterActions(counter.id);
  const hasSpaces = counter.spaceIds.length > 0;

  return (
    <>
      <TaskAutocomplete counter={counter} />
      {counter.links.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {counter.links.map((link) => (
            <li key={link.id} className={ITEM}>
              <SpaceDot
                color={boards.find((board) => board.id === link.spaceId)?.color}
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {link.title}
              </span>
              {link.kind === "series" ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RepeatIcon size={12} />
                  Repeating
                </span>
              ) : (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {link.taskKey}
                </span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className={REMOVE}
                aria-label={`Unlink ${link.title}`}
                disabled={removeLink.isPending}
                onClick={() => removeLink.mutate(link.id)}
              >
                <CloseIcon size={14} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={NOTICE}>
          {hasSpaces
            ? "No tasks picked yet. Search above to add some."
            : "Tasks come from linked spaces."}
        </p>
      )}
    </>
  );
}

const HEADING =
  "flex h-6 items-center text-xs font-medium uppercase tracking-wide text-muted-foreground";

const ITEM =
  "flex h-10 items-center gap-3 rounded-lg bg-white/[0.04] pl-3 pr-1";

const REMOVE = "h-8 w-8 text-muted-foreground";

const NOTICE =
  "rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground";
