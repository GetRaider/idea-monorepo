"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Space, SpaceFolder } from "@repo/api/todex";
import { toast } from "sonner";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogActions,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";

import {
  BoardIcon,
  ChevronIcon,
  DocsIcon,
  FolderIcon,
  KnowledgeIcon,
  PlusIcon,
} from "@components/icons";
import { todexClient } from "@lib/todex-client";
import {
  ModuleSidebarFrame,
  useModuleSidebar,
} from "@components/module-sidebar";
import { ResizeHandle } from "@components/resize-handle";
import {
  clampPanelWidth,
  parseStoredPanelWidth,
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
} from "@/helpers/panel-layout";

import { useDocs } from "./docs-provider";

const WIDTH_STORAGE_KEY = "todex:docs-sidebar-width";

export function DocsModuleSidebar() {
  const pathname = usePathname() ?? "";
  const {
    state: { spaces },
  } = useDocs();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const sensors = useSensors(
    useSensor(SpacePointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const moveSpace = useMutation({
    mutationFn: (input: { spaceId: string; folderId: string | null }) =>
      todexClient.spaces.update(input.spaceId, { folderId: input.folderId }),
    onSuccess: (space) => {
      queryClient.setQueryData<Space[]>(
        ["boards"],
        (current) =>
          current?.map((item) => (item.id === space.id ? space : item)) ?? [
            space,
          ],
      );
    },
    onError: () => toast.error("Could not move the space"),
  });
  const spaceFoldersQuery = useQuery({
    queryKey: ["space-folders"],
    queryFn: () => todexClient.spaceFolders.list(),
  });
  const inbox = spaces.find((space) => space.isInbox);
  const otherSpaces = spaces.filter((space) => !space.isInbox);
  const spaceFolders = spaceFoldersQuery.data ?? [];
  const spaceFolderIds = new Set(spaceFolders.map((folder) => folder.id));
  const rootSpaces = otherSpaces.filter(
    (space) => !space.folderId || !spaceFolderIds.has(space.folderId),
  );
  const inboxHref = inbox ? `/knowledge/space/${inbox.id}` : null;

  function handleSpaceDragEnd(event: DragEndEvent) {
    const drag = event.active.data.current;
    const drop = event.over?.data.current;
    if (!isSpaceDrag(drag) || !isSpaceDrop(drop)) return;
    const folderId = drop.kind === "folder" ? drop.folderId : null;
    if (drag.folderId === folderId) return;
    moveSpace.mutate({ spaceId: drag.spaceId, folderId });
  }
  const { open: isOpen } = useModuleSidebar();
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);

  useEffect(() => {
    setWidth(readWidth());
  }, []);

  return (
    <ModuleSidebarFrame open={isOpen} width={width}>
      <ResizeHandle
        label="Resize sidebar"
        edge="trailing"
        width={width}
        min={TASKS_SIDEBAR_MIN_WIDTH}
        max={TASKS_SIDEBAR_MAX_WIDTH}
        onWidth={setWidth}
        onCommit={writeWidth}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-3 pb-3 pt-3">
        <section className="mb-4 w-full">
          <h2 className="mb-2 px-2 text-sm text-muted-foreground">Views</h2>
          <SidebarLink
            href="/knowledge"
            label="Home"
            active={pathname === "/knowledge"}
            icon={<KnowledgeIcon size={16} />}
          />
          {inbox && inboxHref ? (
            <SidebarLink
              href={inboxHref}
              label="Inbox"
              active={
                pathname === inboxHref || pathname.startsWith(`${inboxHref}/`)
              }
              icon={<BoardIcon size={16} />}
            />
          ) : null}
          <SidebarLink
            href="/knowledge/templates"
            label="Templates"
            active={pathname === "/knowledge/templates"}
            icon={<DocsIcon size={16} />}
          />
        </section>
        <section className="flex min-h-0 w-full flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-sm text-muted-foreground">Spaces</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Create space or folder"
                  onClick={() => setIsCreating(true)}
                >
                  <PlusIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Create space or folder
              </TooltipContent>
            </Tooltip>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={spaceCollisionDetection}
            onDragEnd={handleSpaceDragEnd}
          >
            <RootSpaceList
              spaces={rootSpaces.map((space) => (
                <SpaceRow
                  key={space.id}
                  space={space}
                  pathname={pathname}
                />
              ))}
            >
              {spaceFolders.map((folder) => (
                <SpaceFolderGroup
                  key={folder.id}
                  folder={folder}
                  spaces={otherSpaces.filter(
                    (space) => space.folderId === folder.id,
                  )}
                  pathname={pathname}
                />
              ))}
            </RootSpaceList>
            <SpaceDragOverlay />
          </DndContext>
        </section>
      </div>
      {isCreating ? (
        <CreateKnowledgeDialog onClose={() => setIsCreating(false)} />
      ) : null}
    </ModuleSidebarFrame>
  );
}

function SpaceFolderGroup({
  folder,
  spaces,
  pathname,
}: {
  folder: SpaceFolder;
  spaces: Space[];
  pathname: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { setNodeRef, isOver } = useDroppable({
    id: `space-folder:${folder.id}`,
    data: { kind: "folder", folderId: folder.id } satisfies SpaceDropData,
  });
  const { active } = useDndContext();
  const drag = active?.data.current;
  const showDrop = isOver && isSpaceDrag(drag) && drag.folderId !== folder.id;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div ref={setNodeRef} className="relative rounded-lg">
        {showDrop ? <DropSlot /> : null}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="my-1 flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <ChevronIcon
              size={12}
              className={cn(
                "shrink-0 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            <FolderIcon size={16} />
            <span className="min-w-0 truncate">{folder.name}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {spaces.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              pathname={pathname}
              nested
            />
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function RootSpaceList({
  children,
  spaces,
}: {
  children: ReactNode;
  spaces: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "space-root",
    data: { kind: "root" } satisfies SpaceDropData,
  });
  const { active } = useDndContext();
  const drag = active?.data.current;
  const draggingFromFolder = isSpaceDrag(drag) && drag.folderId != null;

  return (
    <div ref={setNodeRef} className="relative flex min-h-0 flex-1 flex-col">
      {children}
      {draggingFromFolder ? (
        <div
          className={cn(
            "relative my-1 h-10 shrink-0 rounded-lg",
            isOver && "bg-surface/40",
          )}
        >
          <DropSlot />
        </div>
      ) : null}
      {spaces}
    </div>
  );
}

function DropSlot() {
  return (
    <span className="pointer-events-none absolute inset-x-1 inset-y-1 z-10 rounded-lg border border-dotted border-muted-foreground/80" />
  );
}

function SpaceDragOverlay() {
  const { active } = useDndContext();
  const drag = active?.data.current;
  if (!isSpaceDrag(drag)) return null;
  return (
    <DragOverlay dropAnimation={null}>
      <div className="cursor-grabbing rounded-md border border-border bg-panel px-3 py-2 text-sm shadow-lg">
        {drag.label}
      </div>
    </DragOverlay>
  );
}

function SpaceRow({
  space,
  pathname,
  nested = false,
}: {
  space: Space;
  pathname: string;
  nested?: boolean;
}) {
  const href = `/knowledge/space/${space.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `space-board:${space.id}`,
    data: {
      kind: "board",
      spaceId: space.id,
      folderId: space.folderId,
      label: space.name,
    } satisfies SpaceDragData,
  });

  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-0")}>
      <Link
        href={href}
        aria-label={space.name}
        draggable={false}
        className={cn(
          "my-1 flex min-w-0 cursor-grab items-center gap-3 rounded-lg py-1.5 text-sm active:cursor-grabbing",
          nested ? "px-8" : "px-3",
          pathname === href
            ? "bg-surface text-foreground"
            : "text-muted-foreground hover:bg-surface hover:text-foreground",
        )}
        {...listeners}
        {...attributes}
      >
        <BoardIcon size={16} />
        <span className="min-w-0 truncate">{space.name}</span>
      </Link>
    </div>
  );
}

function CreateKnowledgeDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    actions: { createSpace },
  } = useDocs();
  const [kind, setKind] = useState<"space" | "folder">("space");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = name.trim().length > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      if (kind === "folder") {
        await todexClient.spaceFolders.create({ name: name.trim() });
        await queryClient.invalidateQueries({ queryKey: ["space-folders"] });
      } else {
        const space = await createSpace(name.trim());
        router.push(`/knowledge/space/${space.id}`);
      }
      onClose();
    } catch {
      if (kind === "folder") toast.error("Could not create the folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog title="Create space or folder" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Type">
          <div className="flex gap-2">
            {(["space", "folder"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={kind === option}
                className={cn(
                  "h-9 flex-1 rounded-md border text-sm",
                  kind === option
                    ? "border-foreground bg-surface text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setKind(option)}
              >
                {option === "space" ? "Space" : "Folder"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function isSpaceDrag(value: unknown): value is SpaceDragData {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value) || value.kind !== "board") return false;
  if (!("spaceId" in value) || typeof value.spaceId !== "string") return false;
  if (!("folderId" in value)) return false;
  if (!("label" in value) || typeof value.label !== "string") return false;
  return value.folderId === null || typeof value.folderId === "string";
}

const spaceCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
  const folder = hits.find((hit) =>
    String(hit.id).startsWith("space-folder:"),
  );
  if (folder) return [folder];
  const root = hits.find((hit) => hit.id === "space-root");
  if (root) return [root];
  return hits[0] ? [hits[0]] : [];
};

function isSpaceDrop(value: unknown): value is SpaceDropData {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return false;
  }
  if (value.kind === "root") return true;
  return (
    value.kind === "folder" &&
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

function SidebarLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "my-1 flex min-w-0 items-center gap-3 rounded-lg px-3 py-1.5 text-sm",
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function readWidth() {
  try {
    return parseStoredPanelWidth(
      localStorage.getItem(WIDTH_STORAGE_KEY),
      TASKS_SIDEBAR_DEFAULT_WIDTH,
      TASKS_SIDEBAR_MIN_WIDTH,
      TASKS_SIDEBAR_MAX_WIDTH,
    );
  } catch {
    return TASKS_SIDEBAR_DEFAULT_WIDTH;
  }
}

function writeWidth(width: number) {
  try {
    localStorage.setItem(
      WIDTH_STORAGE_KEY,
      String(
        clampPanelWidth(
          width,
          TASKS_SIDEBAR_MIN_WIDTH,
          TASKS_SIDEBAR_MAX_WIDTH,
        ),
      ),
    );
  } catch {
    /* private mode / quota */
  }
}

interface SpaceDragData {
  kind: "board";
  spaceId: string;
  folderId: string | null;
  label: string;
}

type SpaceDropData = { kind: "folder"; folderId: string } | { kind: "root" };
