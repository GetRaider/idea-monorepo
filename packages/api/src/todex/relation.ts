import { z } from "zod";

import { RelationEntityType, RelationKind } from "./enums.ts";

const endpointType = z.enum([
  RelationEntityType.TASK,
  RelationEntityType.DOC,
  RelationEntityType.EPIC,
  RelationEntityType.EVENT,
]);

export const RelationEndpointSchema = z.object({
  type: endpointType,
  id: z.string().trim().min(1).max(128),
});

export const CreateRelationBodySchema = z
  .object({
    kind: z.enum([RelationKind.RELATED_TO, RelationKind.DEPENDS_ON]),
    source: RelationEndpointSchema,
    target: RelationEndpointSchema,
  })
  .strict();

export const ListRelationsQuerySchema = z.object({
  entityType: endpointType,
  entityId: z.string().min(1),
});

export const RelationNeighborSchema = z.object({
  id: z.string(),
  kind: z.enum([
    RelationKind.REFERENCES,
    RelationKind.RELATED_TO,
    RelationKind.DEPENDS_ON,
  ]),
  entityType: endpointType,
  entityId: z.string(),
  title: z.string(),
  spaceId: z.string().nullable(),
  spaceName: z.string().nullable(),
  direction: z.enum(["incoming", "outgoing"]),
});

export const SpaceDeletionPreviewSchema = z.object({
  tasks: z.number().int().nonnegative(),
  goals: z.number().int().nonnegative(),
  documents: z.number().int().nonnegative(),
  epics: z.number().int().nonnegative(),
  docFolders: z.number().int().nonnegative(),
});

export type RelationEndpoint = z.infer<typeof RelationEndpointSchema>;
export type CreateRelationBody = z.infer<typeof CreateRelationBodySchema>;
export type ListRelationsQuery = z.infer<typeof ListRelationsQuerySchema>;
export type RelationNeighbor = z.infer<typeof RelationNeighborSchema>;
export type SpaceDeletionPreview = z.infer<typeof SpaceDeletionPreviewSchema>;
