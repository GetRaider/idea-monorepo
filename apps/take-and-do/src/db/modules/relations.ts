import { relations } from "drizzle-orm";
import { folders } from "./folder/folder.schema";
import { taskBoards } from "./taskBoard/taskBoard.schema";
import { tasks } from "./task/task.schema";
import { labels } from "./label/label.schema";
import { taskLabels } from "./taskLabel/taskLabel.schema";

export const foldersRelations = relations(folders, ({ many }) => ({
  taskBoards: many(taskBoards),
}));

export const taskBoardsRelations = relations(taskBoards, ({ one, many }) => ({
  folder: one(folders, {
    fields: [taskBoards.folderId],
    references: [folders.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  taskBoard: one(taskBoards, {
    fields: [tasks.taskBoardId],
    references: [taskBoards.id],
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

export const labelsRelations = relations(labels, ({ many }) => ({
  taskLabels: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}));

