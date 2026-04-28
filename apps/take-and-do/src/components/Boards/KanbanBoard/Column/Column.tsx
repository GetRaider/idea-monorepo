"use client";

import { Fragment, type ReactNode } from "react";

import { TaskStatus, Task } from "../types";
import {
  Column as ColumnStyles,
  ColumnHeader,
  ColumnTitle,
  StatusIcon,
  Count,
  ColumnContent,
} from "./Column.ui";
import { KanbanDropZone } from "./KanbanDropZone";
import { TaskCard } from "../TaskCard/TaskCard";
import { columnContentMinHeightForExtraSlot } from "./columnLayout.constants";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";

interface ColumnProps {
  tasks: Task[];
  status: TaskStatus;
  /** When false, column body grows with tasks (multi-board); when true, fills viewport and scrolls (single board). */
  bodyScrolls?: boolean;
  /** Optional content rendered above the tasks (e.g. a quick-create row). */
  topSlot?: ReactNode;
  /** Whether this column is the active drop target — used to draw a section ring. */
  isActiveDrop?: boolean;
  onTaskClick?: (task: Task) => void;
}

export const Column = ({
  tasks,
  status,
  bodyScrolls = true,
  topSlot,
  isActiveDrop,
  onTaskClick,
}: ColumnProps) => {
  const contentMinHeightPx = bodyScrolls
    ? undefined
    : columnContentMinHeightForExtraSlot(tasks.length);

  return (
    <ColumnStyles bodyScrolls={bodyScrolls}>
      <ColumnHeader>
        <ColumnTitle>
          <StatusIcon status={status}>
            <TaskStatusGlyph status={status} size={14} />
          </StatusIcon>
          <span>{tasksHelper.status.getName(status)}</span>
          <Count>{tasks.length}</Count>
        </ColumnTitle>
      </ColumnHeader>
      <ColumnContent
        isActiveDrop={isActiveDrop}
        isEmpty={tasks.length === 0}
        bodyScrolls={bodyScrolls}
        contentMinHeightPx={contentMinHeightPx}
      >
        {topSlot ? topSlot : null}

        {tasks.length === 0 ? (
          <KanbanDropZone status={status} index={0} variant="empty" />
        ) : (
          <>
            <KanbanDropZone status={status} index={0} />
            {tasks.map((task, index) => (
              <Fragment key={task.id}>
                <TaskCard task={task} onTaskClick={onTaskClick} />
                {index < tasks.length - 1 ? (
                  <KanbanDropZone status={status} index={index + 1} />
                ) : null}
              </Fragment>
            ))}
            <KanbanDropZone
              status={status}
              index={tasks.length}
              variant="fill"
            />
          </>
        )}
      </ColumnContent>
    </ColumnStyles>
  );
};
