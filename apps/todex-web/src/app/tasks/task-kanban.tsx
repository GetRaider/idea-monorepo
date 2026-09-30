"use client";

import type { ComponentProps } from "react";
import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";
import { Checkbox, cn } from "@repo/ui";

import { TaskComposer, type TaskComposerValues } from "./task-composer";
import { useTasks } from "./tasks-provider";
import {
  BoardDropZone,
  DraggableTask,
  PriorityGlyph,
  StatusGlyph,
  TaskFacts,
} from "./task-board.ui";
import { STATUS_LABEL, STATUS_ORDER, type NestedTask } from "./task-helpers";

export function TaskKanban({
  groups,
  boardNameById,
  showBoardName,
  fastCreate,
  reorderEnabled,
}: {
  groups: Record<Task["status"], NestedTask[]>;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  fastCreate?: FastCreate;
  reorderEnabled: boolean;
}) {
  const {
    state: { selectedTaskId },
    actions: { setSelectedTaskId, updateTaskStatus },
  } = useTasks();

  return (
    <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
      {STATUS_ORDER.map((status) => {
        const nodes = groups[status] ?? [];
        return (
          <section
            key={status}
            className="flex min-h-0 flex-col rounded-lg border border-border bg-panel p-2"
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
                  open={fastCreate.isOpen}
                  onOpenChange={(next) =>
                    next ? fastCreate.onOpen() : fastCreate.onClose()
                  }
                  onCreate={fastCreate.onCreate}
                />
              </div>
            ) : null}
            <div className="flex min-h-24 flex-1 flex-col overflow-auto">
              {reorderEnabled ? (
                nodes.length === 0 ? (
                  <BoardDropZone kind="empty" status={status} index={0} />
                ) : (
                  <>
                    {nodes.map((node, index) => (
                      <div key={node.id}>
                        <BoardDropZone
                          kind="gap"
                          status={status}
                          index={index}
                        />
                        <BoardDropZone
                          kind="card"
                          status={status}
                          index={index}
                        >
                          <KanbanCard
                            node={node}
                            selectedTaskId={selectedTaskId}
                            boardNameById={boardNameById}
                            showBoardName={showBoardName}
                            onSelect={setSelectedTaskId}
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
                    />
                  </>
                )
              ) : (
                <BoardDropZone
                  kind="column"
                  status={status}
                  index={null}
                  className="flex min-h-24 flex-1 flex-col gap-1"
                >
                  {nodes.map((node) => (
                    <KanbanCard
                      key={node.id}
                      node={node}
                      selectedTaskId={selectedTaskId}
                      boardNameById={boardNameById}
                      showBoardName={showBoardName}
                      onSelect={setSelectedTaskId}
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
  selectedTaskId,
  boardNameById,
  showBoardName,
  onSelect,
  onToggleDone,
}: {
  node: NestedTask;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  onSelect: (taskId: string) => void;
  onToggleDone: () => void;
}) {
  return (
    <DraggableTask taskId={node.id}>
      <button
        type="button"
        className={cn(
          "flex w-full items-start gap-2 rounded-md border border-border px-2.5 py-2 text-left hover:bg-surface",
          selectedTaskId === node.id && "bg-surface",
        )}
        onClick={() => onSelect(node.id)}
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
          <TaskFacts task={node} />
          {showBoardName ? (
            <span className="text-xs text-muted-foreground">
              {boardNameById.get(node.taskBoardId)}
            </span>
          ) : null}
        </span>
      </button>
    </DraggableTask>
  );
}

interface FastCreate {
  isOpen: boolean;
  titleRef: ComponentProps<"input">["ref"];
  onOpen: () => void;
  onClose: () => void;
  onCreate: (values: TaskComposerValues) => void;
}
