export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const FolderKind = {
  TASKS: "tasks",
  DOCS: "docs",
} as const;

export const DocType = {
  COMMON: "common",
  GOAL: "goal",
} as const;

export const DocMentionTarget = {
  TASK: "task",
  DOC: "doc",
  EVENT: "event",
} as const;

export const WorkspaceMemberRole = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export const ProgressStageTemplate = {
  FOUNDER: "founder",
} as const;

export const DEFAULT_AREA_NAME = "General";

export const PROGRESS_STAGE_TEMPLATES = {
  founder: ["Discovery", "Product", "Design", "Development", "Validation"],
} as const satisfies Record<
  (typeof ProgressStageTemplate)[keyof typeof ProgressStageTemplate],
  readonly string[]
>;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export type FolderKind = (typeof FolderKind)[keyof typeof FolderKind];
export type DocType = (typeof DocType)[keyof typeof DocType];
export type DocMentionTarget =
  (typeof DocMentionTarget)[keyof typeof DocMentionTarget];
export type WorkspaceMemberRole =
  (typeof WorkspaceMemberRole)[keyof typeof WorkspaceMemberRole];
export type ProgressStageTemplate =
  (typeof ProgressStageTemplate)[keyof typeof ProgressStageTemplate];
