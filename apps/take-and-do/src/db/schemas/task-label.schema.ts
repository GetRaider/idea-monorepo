import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import { labelsTable } from "./label.schema";
import { tasks } from "./task.schema";

export const taskLabelsTable = pgTable(
  "task_labels",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labelsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);
