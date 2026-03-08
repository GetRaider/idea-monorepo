import { relations } from "drizzle-orm";
import { foldersTable } from "./folder/folder.schema";
import { taskBoardsTable } from "./taskBoard/taskBoard.schema";
import { tasks } from "./task/task.schema";
import { labelsTable } from "./label/label.schema";
import { taskLabels } from "./taskLabel/taskLabel.schema";

export const foldersRelations = relations(foldersTable, ({ many }) => ({
  taskBoards: many(taskBoardsTable),
}));

export const taskBoardsRelations = relations(
  taskBoardsTable,
  ({ one, many }) => ({
    folder: one(foldersTable, {
      fields: [taskBoardsTable.folderId],
      references: [foldersTable.id],
    }),
    tasks: many(tasks),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  taskBoard: one(taskBoardsTable, {
    fields: [tasks.taskBoardId],
    references: [taskBoardsTable.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, {
    relationName: "subtasks",
  }),
  taskLabels: many(taskLabels),
}));

export const labelsRelations = relations(labelsTable, ({ many }) => ({
  taskLabels: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labelsTable, {
    fields: [taskLabels.labelId],
    references: [labelsTable.id],
  }),
}));
