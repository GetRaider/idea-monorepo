import { relations } from "drizzle-orm";
import { foldersTable } from "./folder.schema";
import { taskBoardsTable } from "./taskBoard.schema";
import { tasks } from "./task.schema";

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
}));
