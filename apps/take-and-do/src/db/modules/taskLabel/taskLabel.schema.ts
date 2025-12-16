import { pgTable, text } from "drizzle-orm/pg-core";
import { tasks } from "../task/task.schema";
import { labels } from "../label/label.schema";

export const taskLabels = pgTable("task_labels", {
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  labelId: text("label_id")
    .notNull()
    .references(() => labels.id, { onDelete: "cascade" }),
});

