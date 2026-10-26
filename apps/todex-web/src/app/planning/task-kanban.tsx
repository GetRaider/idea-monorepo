"use client";

import type { ComponentProps, MouseEvent } from "react";
import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";
import { Checkbox, cn } from "@repo/ui";

import { EpicRows } from "./epic-row";
import { TaskComposer, type TaskComposerValues } from "./task-composer";
import { TaskContextMenu } from "./task-context-menu";
import { isToggleClick, orderedTaskIds } from "./task-selection";
import { useTasks } from "./tasks-provider";
import {
  BoardDropZone,
  DraggableTask,
  InlineTitle,
  PriorityMenu,
  StatusGlyph,
  TaskFacts,
  TaskProgressBar,
} from "./task-board.ui";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  statusAfterDoneToggle,
  taskChecklistProgress,
  type EpicColumn,
  type NestedTask,
} from "./task-helpers";

export function TaskKanban({
  groups,
  epicColumns,
  spaceName,
  allowEpicTasks = true,
  spaceNameById,
  showBoardName,
  fastCreate,
  reorderEnabled,
  spaceId,
  layout = "fill",
}: {
  groups: Record<Task["status"], NestedTask[]>;
  epicColumns?: Record<
    Task["status"],
    { epics: EpicColumn[]; tasks: NestedTask[] }
  > | null;
  spaceName?: string;
  allowEpicTasks?: boolean;
  spaceNameById: Map<string, string>;
  showBoardName: boolean;
  fastCreate?: FastCreate;
  reorderEnabled: boolean;
  spaceId?: string;
  layout?: "fill" | "stack";
}) {
  const {
    state: { selectedTaskIds },
    actions: { updateTaskStatus, clearTaskSelection },
  } = useTasks();

  return (
    <div
      data-task-surface=""
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4",
        layout === "fill" ? "min-h-0 flex-1" : "shrink-0",
      )}
      onClick={(event) => {
        if (!(event.target instanceof Element)) return;
        if (
          event.target.closest(
            "[data-task-id], input, textarea, button, a, [contenteditable='true']",
          )
        ) {
          return;
        }
        clearTaskSelection();
      }}
    >
      {STATUS_ORDER.map((status) => {
        const nodes = groups[status] ?? [];
        return (
          <section
            key={status}
            className={cn(
              "flex flex-col rounded-lg border border-border bg-panel p-2",
              layout === "fill" && "min-h-0",
            )}
          >
            <div className="mb-2 flex items-center gap-2 px-1 py-1 text-sm font-semibold">
              <StatusGlyph status={status} />
              <span>{STATUS_LABEL[status]}</span>
              <span className="text-muted-foreground">
                {nodes.length + (epicColumns?.[status].epics.length ?? 0)}
              </span>
            </div>
            {status === TaskStatus.TODO && fastCreate ? (
              <div className="mb-2">
                <TaskComposer
                  titleRef={fastCreate.titleRef}
                  defaultBoardId={fastCreate.defaultBoardId}
                  defaultScheduleDate={fastCreate.defaultScheduleDate}
                  open={fastCreate.isOpen}
                  onOpenChange={(next) =>
                    next ? fastCreate.onOpen() : fastCreate.onClose()
                  }
                  onCreate={fastCreate.onCreate}
                />
              </div>
            ) : null}
            <div
              className={cn(
                "flex min-h-24 flex-col",
                layout === "fill" && "min-h-0 flex-1 overflow-auto",
              )}
            >
              {spaceId && spaceName && epicColumns ? (
                <EpicRows
                  rows={epicColumns[status].epics}
                  spaceName={spaceName}
                  spaceId={spaceId}
                  allowTasks={allowEpicTasks}
                />
              ) : null}
              {reorderEnabled ? (
                nodes.length === 0 ? (
                  <BoardDropZone
                    kind="empty"
                    status={status}
                    index={0}
                    spaceId={spaceId}
                  />
                ) : (
                  <>
                    {nodes.map((node, index) => (
                      <div key={node.id}>
                        <BoardDropZone
                          kind="gap"
                          status={status}
                          index={index}
                          spaceId={spaceId}
                        />
                        <BoardDropZone
                          kind="card"
                          status={status}
                          index={index}
                          spaceId={spaceId}
                        >
                          <KanbanCard
                            node={node}
                            selected={selectedTaskIds.has(node.id)}
                            spaceNameById={spaceNameById}
                            showBoardName={showBoardName}
                            onToggleDone={() =>
                              updateTaskStatus(
                                node.id,
                                statusAfterDoneToggle(node.status),
                              )
                            }
                          />
                        </BoardDropZone>
                      </div>
                    ))}
                    <BoardDropZone
                      kind="fill"
                      status={status}
                      index={nodes.length}
                      spaceId={spaceId}
                    />
                  </>
                )
              ) : (
                <BoardDropZone
                  kind="column"
                  status={status}
                  index={null}
                  spaceId={spaceId}
                  className="flex min-h-24 flex-1 flex-col gap-1"
                >
                  {nodes.map((node) => (
                    <KanbanCard
                      key={node.id}
                      node={node}
                      selected={selectedTaskIds.has(node.id)}
                      spaceNameById={spaceNameById}
                      showBoardName={showBoardName}
                      onToggleDone={() =>
                        updateTaskStatus(
                          node.id,
                          statusAfterDoneToggle(node.status),
                        )
                      }
                    />
                  ))}
                </BoardDropZone>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function KanbanCard({
  node,
  selected,
  spaceNameById,
  showBoardName,
  onToggleDone,
}: {
  node: NestedTask;
  selected: boolean;
  spaceNameById: Map<string, string>;
  showBoardName: boolean;
  onToggleDone: () => void;
}) {
  const progress = taskChecklistProgress({
    acceptanceCriteria: node.acceptanceCriteria,
    subtasks: node.children,
  });

  const {
    actions: { selectTask, updateTask },
  } = useTasks();

  function selectFromPointer(event: MouseEvent<HTMLElement>) {
    selectTask(
      node.id,
      {
        shift: event.shiftKey,
        toggle: isToggleClick(event, navigator.platform),
      },
      orderedTaskIds(event.currentTarget.closest("[data-task-surface]")),
    );
  }

  return (
    <DraggableTask taskId={node.id}>
      <TaskContextMenu taskId={node.id}>
        <div
          data-task-id={node.id}
          className={cn(
            "flex w-full items-start gap-2 rounded-md border border-border px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface",
            node.status === TaskStatus.DONE &&
              "bg-black/30 text-muted-foreground",
            node.status === TaskStatus.CANCELLED &&
              "text-muted-foreground line-through",
            selected && "bg-surface text-foreground",
          )}
          onMouseDown={(event) => {
            if (event.shiftKey) event.preventDefault();
          }}
          onClick={selectFromPointer}
        >
          <Checkbox
            data-no-dnd=""
            checked={node.status === TaskStatus.DONE}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={onToggleDone}
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-2">
              <PriorityMenu
                priority={node.priority}
                onSelect={(priority) => updateTask(node.id, { priority })}
              />
              <span className="font-mono text-xs text-muted-foreground">
                {node.taskKey}
              </span>
            </span>
            <InlineTitle
              value={node.summary}
              className="w-full"
              onSave={(summary) => updateTask(node.id, { summary })}
            />
            <TaskProgressBar
              done={progress.done}
              total={progress.total}
              className="text-xs text-muted-foreground"
            />
            <TaskFacts task={node} />
            {showBoardName ? (
              <span className="text-xs text-muted-foreground">
                {spaceNameById.get(node.spaceId)}
              </span>
            ) : null}
          </span>
        </div>
      </TaskContextMenu>
    </DraggableTask>
  );
}

interface FastCreate {
  isOpen: boolean;
  titleRef: ComponentProps<"input">["ref"];
  defaultBoardId?: string;
  defaultScheduleDate?: string;
  onOpen: () => void;
  onClose: () => void;
  onCreate: (values: TaskComposerValues) => void;
}
