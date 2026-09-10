"use client";

import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";
import { Checkbox, cn } from "@repo/ui";

import { useTasks } from "./tasks-provider";
import {
  DraggableTask,
  PRIORITY_DOT,
  StatusDroppable,
  StatusGlyph,
} from "./task-board.ui";
import { STATUS_LABEL, STATUS_ORDER, type NestedTask } from "./task-helpers";

export function TaskKanban({
  groups,
  boardNameById,
  showBoardName,
}: {
  groups: Record<Task["status"], NestedTask[]>;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
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
          <StatusDroppable
            key={status}
            status={status}
            className="flex min-h-0 flex-col rounded-lg border border-border bg-panel p-2"
          >
            <div className="mb-2 flex items-center gap-2 px-1 py-1 text-sm font-semibold">
              <StatusGlyph status={status} />
              <span>{STATUS_LABEL[status]}</span>
              <span className="text-muted-foreground">{nodes.length}</span>
            </div>
            <ul className="flex min-h-24 flex-1 flex-col gap-1 overflow-auto">
              {nodes.map((node) => (
                <li key={node.id}>
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
                </li>
              ))}
            </ul>
          </StatusDroppable>
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
          checked={node.status === TaskStatus.DONE}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={onToggleDone}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                PRIORITY_DOT[node.priority],
              )}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {node.taskKey}
            </span>
          </span>
          <span className="text-sm">{node.summary}</span>
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
