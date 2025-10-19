import React from "react";

import { TaskStatus } from "../KanbanBoard";
import {
  Column as ColumnStyles,
  ColumnHeader,
  ColumnTitle,
  StatusIcon,
  Count,
  ColumnContent,
} from "./Column.styles";
import { Task } from "../KanbanBoard";
import TaskCard from "../TaskCard/TaskCard";

export const Column = ({
  tasks,
  status,
}: {
  tasks: Task[];
  status: TaskStatus;
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case TaskStatus.TODO:
        return "◯";
      case TaskStatus.IN_PROGRESS:
        return "◐";
      case TaskStatus.DONE:
        return "✓";
      default:
        return "◯";
    }
  };
  return (
    <ColumnStyles>
      <ColumnHeader>
        <ColumnTitle>
          <StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
          <span>{status}</span>
          <Count>{tasks.length}</Count>
        </ColumnTitle>
      </ColumnHeader>
      <ColumnContent>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </ColumnContent>
    </ColumnStyles>
  );
};
