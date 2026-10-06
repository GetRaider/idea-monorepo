"use client";

import type { ComponentProps, MouseEvent } from "react";
import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";
import { Checkbox, cn } from "@repo/ui";

import { TaskComposer, type TaskComposerValues } from "./task-composer";
import { TaskContextMenu } from "./task-context-menu";
import { isToggleClick, orderedTaskIds } from "./task-selection";
import { useTasks } from "./tasks-provider";
import {
  BoardDropZone,
  DraggableTask,
  PriorityGlyph,
  StatusGlyph,
  TaskFacts,
  TaskProgressBar,
} from "./task-board.ui";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  taskChecklistProgress,
  type NestedTask,
} from "./task-helpers";

export function TaskKanban({
  groups,
  boardNameById,
  showBoardName,
  fastCreate,
  reorderEnabled,
  boardId,
  layout = "fill",
}: {
  groups: Record<Task["status"], NestedTask[]>;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  fastCreate?: FastCreate;
  reorderEnabled: boolean;
  boardId?: string;
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
        "grid grid-cols-3 gap-3",
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
              <span className="text-muted-foreground">{nodes.length}</span>
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
              {reorderEnabled ? (
                nodes.length === 0 ? (
                  <BoardDropZone
                    kind="empty"
                    status={status}
                    index={0}
                    boardId={boardId}
                  />
                ) : (
                  <>
                    {nodes.map((node, index) => (
                      <div key={node.id}>
                        <BoardDropZone
                          kind="gap"
                          status={status}
                          index={index}
                          boardId={boardId}
                        />
                        <BoardDropZone
                          kind="card"
                          status={status}
                          index={index}
                          boardId={boardId}
                        >
                          <KanbanCard
                            node={node}
                            selected={selectedTaskIds.has(node.id)}
                            boardNameById={boardNameById}
                            showBoardName={showBoardName}
                            onToggleDone={() =>
                              updateTaskStatus(
                                node.id,
                                node.status === TaskStatus.DONE
                                  ? TaskStatus.TODO
                                  : TaskStatus.DONE,
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
                      boardId={boardId}
                    />
                  </>
                )
              ) : (
                <BoardDropZone
                  kind="column"
                  status={status}
                  index={null}
                  boardId={boardId}
                  className="flex min-h-24 flex-1 flex-col gap-1"
                >
                  {nodes.map((node) => (
                    <KanbanCard
                      key={node.id}
                      node={node}
                      selected={selectedTaskIds.has(node.id)}
                      boardNameById={boardNameById}
                      showBoardName={showBoardName}
                      onToggleDone={() =>
                        updateTaskStatus(
                          node.id,
                          node.status === TaskStatus.DONE
                            ? TaskStatus.TODO
                            : TaskStatus.DONE,
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

function KanbanCard({
  node,
  selected,
  boardNameById,
  showBoardName,
  onToggleDone,
}: {
  node: NestedTask;
  selected: boolean;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  onToggleDone: () => void;
}) {
  const progress = taskChecklistProgress({
    acceptanceCriteria: node.acceptanceCriteria,
    subtasks: node.children,
  });

  const {
    actions: { selectTask },
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
        <button
          type="button"
          data-task-id={node.id}
          className={cn(
            "flex w-full items-start gap-2 rounded-md border border-border px-2.5 py-2 text-left hover:bg-surface",
            node.status === TaskStatus.DONE &&
              "bg-black/30 text-muted-foreground",
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
              <PriorityGlyph priority={node.priority} />
              <span className="font-mono text-xs text-muted-foreground">
                {node.taskKey}
              </span>
            </span>
            <span className="text-sm">{node.summary}</span>
            <TaskProgressBar
              done={progress.done}
              total={progress.total}
              className="text-xs text-muted-foreground"
            />
            <TaskFacts task={node} />
            {showBoardName ? (
              <span className="text-xs text-muted-foreground">
                {boardNameById.get(node.taskBoardId)}
              </span>
            ) : null}
          </span>
        </button>
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
