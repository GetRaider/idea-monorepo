"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_SPACE_COLOR,
  type Space,
  type SpaceColor,
} from "@repo/api/todex";
import { toast } from "sonner";
import {
  Button,
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
  DocsIcon,
  FolderIcon,
  KnowledgeIcon,
  PlusIcon,
} from "@components/icons";
import { SpaceColorPicker } from "@components/space-color-picker";
import { SpaceSwatch } from "@components/space-swatch";
import { todexClient } from "@lib/todex-client";
import {
  ModuleSidebarFrame,
  useModuleSidebar,
} from "@components/module-sidebar";
import { ResizeHandle } from "@components/resize-handle";
import { SpacesSidebarList } from "@components/spaces-sidebar";
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
  const [isCreating, setIsCreating] = useState(false);
  const spaceFoldersQuery = useQuery({
    queryKey: ["space-folders"],
    queryFn: () => todexClient.spaceFolders.list(),
  });
  const inbox = spaces.find((space) => space.isInbox);
  const spaceFolders = spaceFoldersQuery.data ?? [];
  const inboxHref = inbox ? `/knowledge/space/${inbox.id}` : null;
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
          <SpacesSidebarList
            spaces={spaces}
            folders={spaceFolders}
            renderSpace={(space, nested) => ({
              content: (
                <KnowledgeSpaceLink
                  space={space}
                  pathname={pathname}
                  nested={nested}
                />
              ),
            })}
            renderFolder={(folder) => ({
              content: (
                <>
                  <FolderIcon size={16} />
                  <span className="min-w-0 truncate">{folder.name}</span>
                </>
              ),
            })}
          />
        </section>
      </div>
      {isCreating ? (
        <CreateKnowledgeDialog onClose={() => setIsCreating(false)} />
      ) : null}
    </ModuleSidebarFrame>
  );
}

function KnowledgeSpaceLink({
  space,
  pathname,
  nested,
}: {
  space: Space;
  pathname: string;
  nested: boolean;
}) {
  const href = `/knowledge/space/${space.id}`;
  return (
    <Link
      href={href}
      aria-label={space.name}
      draggable={false}
      className={cn(
        "my-1 flex min-w-0 items-center gap-3 rounded-lg py-1.5 text-sm",
        nested ? "px-8" : "px-3",
        pathname === href
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      <SpaceSwatch color={space.color} />
      <span className="min-w-0 truncate">{space.name}</span>
    </Link>
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
  const [color, setColor] = useState<SpaceColor>(DEFAULT_SPACE_COLOR);
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
        const space = await createSpace(name.trim(), color);
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
        {kind === "space" ? (
          <Field label="Color">
            <SpaceColorPicker value={color} onChange={setColor} />
          </Field>
        ) : null}
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
