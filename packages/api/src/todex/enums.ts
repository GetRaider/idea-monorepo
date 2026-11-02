export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const DocType = {
  COMMON: "common",
  GOAL: "goal",
} as const;

export const GoalStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  DONE: "done",
} as const;

export const DocMentionTarget = {
  TASK: "task",
  DOC: "doc",
  EPIC: "epic",
  EVENT: "event",
} as const;

export const RelationKind = {
  REFERENCES: "references",
  RELATED_TO: "related_to",
  DEPENDS_ON: "depends_on",
} as const;

export const RelationOrigin = {
  MENTION: "mention",
  EXPLICIT: "explicit",
} as const;

export const RelationEntityType = {
  TASK: "task",
  DOC: "doc",
  EPIC: "epic",
  EVENT: "event",
  SPACE: "space",
  DOC_FOLDER: "doc_folder",
} as const;

export const WorkspaceMemberRole = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export const ProgressStageTemplate = {
  FOUNDER: "founder",
} as const;

export const DEFAULT_SECTION_NAME = "General";

export const PROGRESS_STAGE_TEMPLATES = {
  founder: ["Discovery", "Product", "Design", "Development", "Validation"],
} as const satisfies Record<
  (typeof ProgressStageTemplate)[keyof typeof ProgressStageTemplate],
  readonly string[]
>;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export type DocType = (typeof DocType)[keyof typeof DocType];
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];
export type DocMentionTarget =
  (typeof DocMentionTarget)[keyof typeof DocMentionTarget];
export type RelationKind = (typeof RelationKind)[keyof typeof RelationKind];
export type RelationOrigin = (typeof RelationOrigin)[keyof typeof RelationOrigin];
export type RelationEntityType =
  (typeof RelationEntityType)[keyof typeof RelationEntityType];
export type WorkspaceMemberRole =
  (typeof WorkspaceMemberRole)[keyof typeof WorkspaceMemberRole];
export type ProgressStageTemplate =
  (typeof ProgressStageTemplate)[keyof typeof ProgressStageTemplate];
