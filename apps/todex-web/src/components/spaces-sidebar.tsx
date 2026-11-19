"use client";

import { useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextMenu,
  ContextMenuTrigger,
  cn,
} from "@repo/ui";
import { positionForDrop, type Space, type SpaceFolder } from "@repo/api/todex";
import { toast } from "sonner";

import { ChevronIcon } from "./icons";
import { todexClient } from "@lib/todex-client";

export function SpacesSidebarList({
  spaces,
  folders,
  renderSpace,
  renderFolder,
}: SpacesSidebarListProps) {
  const sensors = useSensors(
    useSensor(SpacePointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const reorder = useSpaceReorder();
  const rows = topLevelRows(spaces, folders);

  function handleDragEnd(event: DragEndEvent) {
    const drag = event.active.data.current;
    const drop = event.over?.data.current;
    if (isInsertDrop(drop)) {
      moveToInsert(rows, spaces, drag, drop, reorder);
      return;
    }
    if (!isIntoFolderDrop(drop) || !isSpaceDrag(drag)) return;
    if (drag.folderId === drop.folderId) return;
    const siblingIds = spaces
      .filter((space) => space.folderId === drop.folderId)
      .sort(byPosition)
      .map((space) => space.id);
    const position = positionForDrop(
      siblingIds,
      (id) => spaces.find((space) => space.id === id)?.position ?? null,
      drag.spaceId,
      null,
    );
    reorder.space(drag.spaceId, {
      folderId: drop.folderId,
      position: position ?? 0,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={spaceCollisionDetection}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {rows.map((row) => (
          <div key={row.id}>
            <InsertLine list="top" beforeId={row.id} />
            {row.kind === "folder" ? (
              <FolderBlock
                folder={row.folder}
                spaces={spaces
                  .filter((space) => space.folderId === row.folder.id)
                  .sort(byPosition)}
                renderSpace={renderSpace}
                renderFolder={renderFolder}
              />
            ) : (
              <SpaceBlock
                space={row.space}
                nested={false}
                renderSpace={renderSpace}
              />
            )}
          </div>
        ))}
        <InsertLine list="top" beforeId={null} />
      </div>
      <SpaceDragOverlay />
    </DndContext>
  );
}

function FolderBlock({
  folder,
  spaces,
  renderSpace,
  renderFolder,
}: {
  folder: SpaceFolder;
  spaces: Space[];
  renderSpace: SpacesSidebarListProps["renderSpace"];
  renderFolder: SpacesSidebarListProps["renderFolder"];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const rendered = renderFolder(folder);
  const draggable = useDraggable({
    id: `space-folder-drag:${folder.id}`,
    data: {
      kind: "folder",
      folderId: folder.id,
      label: folder.name,
    } satisfies SidebarDragData,
  });
  const droppable = useDroppable({
    id: `space-folder:${folder.id}`,
    data: {
      kind: "into-folder",
      folderId: folder.id,
    } satisfies SidebarDropData,
  });
  const { active } = useDndContext();
  const drag = active?.data.current;
  const showNest =
    droppable.isOver && isSpaceDrag(drag) && drag.folderId !== folder.id;
  const header = (
    <div
      ref={(node) => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      className={cn(
        "relative my-1 flex items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground",
        draggable.isDragging && "opacity-0",
        "cursor-grab active:cursor-grabbing",
      )}
      {...draggable.listeners}
      {...draggable.attributes}
    >
      {showNest ? <NestOutline /> : null}
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-lg py-1.5 pl-2 pr-1"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${folder.name}`}
        >
          <ChevronIcon
            size={12}
            className={cn(
              "shrink-0 transition-transform",
              isExpanded && "rotate-90",
            )}
          />
        </button>
      </CollapsibleTrigger>
      <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-3 text-left text-sm">
        {rendered.content}
      </div>
    </div>
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      {rendered.menu ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{header}</ContextMenuTrigger>
          {rendered.menu}
        </ContextMenu>
      ) : (
        header
      )}
      <CollapsibleContent>
        {spaces.map((space) => (
          <div key={space.id}>
            <InsertLine
              list="folder"
              folderId={folder.id}
              beforeId={space.id}
            />
            <SpaceBlock space={space} nested renderSpace={renderSpace} />
          </div>
        ))}
        <InsertLine list="folder" folderId={folder.id} beforeId={null} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function SpaceBlock({
  space,
  nested,
  renderSpace,
}: {
  space: Space;
  nested: boolean;
  renderSpace: SpacesSidebarListProps["renderSpace"];
}) {
  const rendered = renderSpace(space, nested);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `space-board:${space.id}`,
    data: {
      kind: "space",
      spaceId: space.id,
      folderId: space.folderId,
      label: space.name,
    } satisfies SidebarDragData,
  });
  const row = (
    <div
      ref={setNodeRef}
      className={cn(
        isDragging && "opacity-0",
        "cursor-grab active:cursor-grabbing",
      )}
      {...listeners}
      {...attributes}
    >
      {rendered.content}
    </div>
  );
  if (!rendered.menu) return row;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      {rendered.menu}
    </ContextMenu>
  );
}

function InsertLine({
  list,
  folderId,
  beforeId,
}: {
  list: "top" | "folder";
  folderId?: string;
  beforeId: string | null;
}) {
  const id =
    list === "top"
      ? `space-insert:top:${beforeId ?? "end"}`
      : `space-insert:folder:${folderId}:${beforeId ?? "end"}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      kind: "insert",
      list,
      folderId: folderId ?? null,
      beforeId,
    } satisfies SidebarDropData,
  });

  return (
    <div ref={setNodeRef} className="relative h-2 -my-1 shrink-0">
      {isOver ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-0.5 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
        />
      ) : null}
    </div>
  );
}

function SpaceDragOverlay() {
  const { active } = useDndContext();
  const drag = active?.data.current;
  if (!isSpaceDrag(drag) && !isFolderDrag(drag)) return null;
  return (
    <DragOverlay dropAnimation={null}>
      <div className="cursor-grabbing rounded-md border border-border bg-panel px-3 py-2 text-sm shadow-lg">
        {drag.label}
      </div>
    </DragOverlay>
  );
}

function NestOutline() {
  return (
    <span className="pointer-events-none absolute inset-x-1 inset-y-1 z-10 rounded-lg border border-dotted border-muted-foreground/80" />
  );
}

function useSpaceReorder() {
  const queryClient = useQueryClient();
  const spaceRequest = useRef(0);
  const folderRequest = useRef(0);

  return {
    space(
      spaceId: string,
      patch: { folderId?: string | null; position: number },
    ) {
      const request = ++spaceRequest.current;
      const previous = queryClient.getQueryData<Space[]>(SPACE_KEY);
      queryClient.setQueryData<Space[]>(SPACE_KEY, (current) =>
        current?.map((space) =>
          space.id === spaceId
            ? {
                ...space,
                position: patch.position,
                folderId:
                  patch.folderId === undefined
                    ? space.folderId
                    : patch.folderId,
              }
            : space,
        ),
      );
      void todexClient.spaces
        .update(spaceId, {
          position: patch.position,
          ...(patch.folderId !== undefined ? { folderId: patch.folderId } : {}),
        })
        .then((space) => {
          if (request !== spaceRequest.current) return;
          queryClient.setQueryData<Space[]>(
            SPACE_KEY,
            (current) =>
              current?.map((item) => (item.id === space.id ? space : item)) ?? [
                space,
              ],
          );
        })
        .catch(() => {
          if (request !== spaceRequest.current) return;
          queryClient.setQueryData(SPACE_KEY, previous);
          toast.error("Could not reorder the space");
        });
    },
    folder(folderId: string, position: number) {
      const request = ++folderRequest.current;
      const previous = queryClient.getQueryData<SpaceFolder[]>(FOLDER_KEY);
      queryClient.setQueryData<SpaceFolder[]>(FOLDER_KEY, (current) =>
        current?.map((folder) =>
          folder.id === folderId ? { ...folder, position } : folder,
        ),
      );
      void todexClient.spaceFolders
        .update(folderId, { position })
        .then((folder) => {
          if (request !== folderRequest.current) return;
          queryClient.setQueryData<SpaceFolder[]>(
            FOLDER_KEY,
            (current) =>
              current?.map((item) =>
                item.id === folder.id ? folder : item,
              ) ?? [folder],
          );
        })
        .catch(() => {
          if (request !== folderRequest.current) return;
          queryClient.setQueryData(FOLDER_KEY, previous);
          toast.error("Could not reorder the folder");
        });
    },
  };
}

function moveToInsert(
  rows: SidebarRow[],
  spaces: Space[],
  drag: unknown,
  drop: Extract<SidebarDropData, { kind: "insert" }>,
  reorder: ReturnType<typeof useSpaceReorder>,
) {
  if (isFolderDrag(drag)) {
    if (drop.list !== "top") return;
    const position = positionForDrop(
      rows.map((row) => row.id),
      (id) => rows.find((row) => row.id === id)?.position ?? null,
      drag.folderId,
      drop.beforeId,
    );
    if (position == null) return;
    reorder.folder(drag.folderId, position);
    return;
  }
  if (!isSpaceDrag(drag)) return;
  if (drop.list === "folder" && drop.folderId == null) return;
  const destinationFolderId = drop.list === "folder" ? drop.folderId : null;
  const orderedIds =
    drop.list === "top"
      ? rows.map((row) => row.id)
      : spaces
          .filter((space) => space.folderId === drop.folderId)
          .sort(byPosition)
          .map((space) => space.id);
  const position = positionForDrop(
    orderedIds,
    (id) => positionInList(rows, spaces, id),
    drag.spaceId,
    drop.beforeId,
  );
  if (position == null) return;
  reorder.space(drag.spaceId, {
    position,
    ...(drag.folderId !== destinationFolderId
      ? { folderId: destinationFolderId }
      : {}),
  });
}

function positionInList(rows: SidebarRow[], spaces: Space[], id: string) {
  return (
    rows.find((row) => row.id === id)?.position ??
    spaces.find((space) => space.id === id)?.position ??
    null
  );
}

function topLevelRows(spaces: Space[], folders: SpaceFolder[]): SidebarRow[] {
  const rows: SidebarRow[] = [
    ...folders.map((folder) => ({
      kind: "folder" as const,
      id: folder.id,
      position: folder.position,
      folder,
    })),
    ...spaces
      .filter((space) => !space.folderId && !space.isInbox)
      .map((space) => ({
        kind: "space" as const,
        id: space.id,
        position: space.position,
        space,
      })),
  ];
  return rows.sort(byPosition);
}

function byPosition<T extends { position: number; id: string }>(
  left: T,
  right: T,
) {
  const delta = left.position - right.position;
  if (delta !== 0) return delta;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

const spaceCollisionDetection: CollisionDetection = (args) => {
  const drag = args.active.data.current;
  const hits = pointerWithin(args);
  const insert = hits.find((hit) => {
    const id = String(hit.id);
    if (!id.startsWith("space-insert:")) return false;
    if (isFolderDrag(drag)) return id.startsWith("space-insert:top:");
    return isSpaceDrag(drag);
  });
  if (insert) return [insert];
  if (!isSpaceDrag(drag)) return [];
  const folder = hits.find((hit) => String(hit.id).startsWith("space-folder:"));
  return folder ? [folder] : [];
};

function isSpaceDrag(
  value: unknown,
): value is Extract<SidebarDragData, { kind: "space" }> {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value) || value.kind !== "space") return false;
  if (!("spaceId" in value) || typeof value.spaceId !== "string") return false;
  if (!("folderId" in value)) return false;
  if (!("label" in value) || typeof value.label !== "string") return false;
  return value.folderId === null || typeof value.folderId === "string";
}

function isFolderDrag(
  value: unknown,
): value is Extract<SidebarDragData, { kind: "folder" }> {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value) || value.kind !== "folder") return false;
  if (!("folderId" in value) || typeof value.folderId !== "string")
    return false;
  if (!("label" in value) || typeof value.label !== "string") return false;
  return true;
}

function isInsertDrop(
  value: unknown,
): value is Extract<SidebarDropData, { kind: "insert" }> {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value) || value.kind !== "insert") return false;
  if (!("list" in value) || (value.list !== "top" && value.list !== "folder")) {
    return false;
  }
  if (!("beforeId" in value)) return false;
  return value.beforeId === null || typeof value.beforeId === "string";
}

function isIntoFolderDrop(
  value: unknown,
): value is Extract<SidebarDropData, { kind: "into-folder" }> {
  if (typeof value !== "object" || value === null) return false;
  return (
    "kind" in value &&
    value.kind === "into-folder" &&
    "folderId" in value &&
    typeof value.folderId === "string"
  );
}

class SpacePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false;
        const target = nativeEvent.target;
        if (
          target instanceof Element &&
          target.closest("button, input, textarea, select, [data-no-dnd]")
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}

const SPACE_KEY = ["boards"];
const FOLDER_KEY = ["space-folders"];

interface SpacesSidebarListProps {
  spaces: Space[];
  folders: SpaceFolder[];
  renderSpace: (
    space: Space,
    nested: boolean,
  ) => { content: ReactNode; menu?: ReactNode };
  renderFolder: (folder: SpaceFolder) => {
    content: ReactNode;
    menu?: ReactNode;
  };
}

type SidebarRow =
  | { kind: "folder"; id: string; position: number; folder: SpaceFolder }
  | { kind: "space"; id: string; position: number; space: Space };

type SidebarDragData =
  | {
      kind: "space";
      spaceId: string;
      folderId: string | null;
      label: string;
    }
  | { kind: "folder"; folderId: string; label: string };

type SidebarDropData =
  | {
      kind: "insert";
      list: "top" | "folder";
      folderId: string | null;
      beforeId: string | null;
    }
  | { kind: "into-folder"; folderId: string };
