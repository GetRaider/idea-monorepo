"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogActions,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import { DocType } from "@repo/api/todex";

import { NewButton } from "@components/new-button";

import { useDocs } from "./docs-provider";

export function DocsCanvasHeader({
  crumbs,
  spaceId = null,
  folderId = null,
  showNew = true,
  trailing,
}: {
  crumbs: DocsCrumb[];
  spaceId?: string | null;
  folderId?: string | null;
  showNew?: boolean;
  trailing?: ReactNode;
}) {
  const {
    state: { spaces },
    actions: { createDoc, createFolder },
  } = useDocs();
  const router = useRouter();
  const [picker, setPicker] = useState<null | "doc" | "folder">(null);
  const currentSpace = spaces.find((space) => space.id === spaceId) ?? null;
  const folderSpaces = spaces.filter((space) => !space.isInbox);
  const canCreateFolder = currentSpace
    ? !currentSpace.isInbox
    : folderSpaces.length > 0;

  function createDocument(targetSpaceId: string) {
    void createDoc(DocType.COMMON, targetSpaceId, folderId);
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <DocsBreadcrumb className="min-w-0" crumbs={crumbs} />
      {showNew || trailing ? (
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          {showNew ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <NewButton />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    if (spaceId) {
                      createDocument(spaceId);
                      return;
                    }
                    setPicker("doc");
                  }}
                >
                  Doc
                </DropdownMenuItem>
                {canCreateFolder ? (
                  <DropdownMenuItem onSelect={() => setPicker("folder")}>
                    Folder
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}
      {picker ? (
        <CreateKnowledgeItemDialog
          kind={picker}
          spaces={picker === "folder" ? folderSpaces : spaces}
          spaceId={
            picker === "folder" && currentSpace?.isInbox ? null : spaceId
          }
          onClose={() => setPicker(null)}
          onCreateDoc={createDocument}
          onCreateFolder={async (targetSpaceId, name) => {
            const folder = await createFolder(name, targetSpaceId);
            router.push(
              `/knowledge/space/${targetSpaceId}/folder/${folder.id}`,
            );
          }}
        />
      ) : null}
    </div>
  );
}

function CreateKnowledgeItemDialog({
  kind,
  spaces,
  spaceId,
  onClose,
  onCreateDoc,
  onCreateFolder,
}: {
  kind: "doc" | "folder";
  spaces: { id: string; name: string }[];
  spaceId: string | null;
  onClose: () => void;
  onCreateDoc: (spaceId: string) => void;
  onCreateFolder: (spaceId: string, name: string) => Promise<void>;
}) {
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId ?? "");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const needsSpace = !spaceId;
  const canSubmit =
    (!needsSpace || selectedSpaceId !== "") &&
    (kind === "doc" || name.trim().length > 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const targetSpaceId = spaceId ?? selectedSpaceId;
    setIsSubmitting(true);
    try {
      if (kind === "doc") {
        onCreateDoc(targetSpaceId);
      } else {
        await onCreateFolder(targetSpaceId, name.trim());
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog title={kind === "doc" ? "New doc" : "New folder"} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        {needsSpace ? (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Space</Label>
            <Select
              value={selectedSpaceId || undefined}
              onValueChange={setSelectedSpaceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a space" />
              </SelectTrigger>
              <SelectContent className="z-[5000]">
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {kind === "folder" ? (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
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

export function DocsBreadcrumb({
  crumbs,
  className,
}: {
  crumbs: DocsCrumb[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight",
        className,
      )}
    >
      {crumbs.map((crumb, index) => (
        <span
          key={`${crumb.label}-${index}`}
          className="flex shrink-0 items-center gap-3"
        >
          {index > 0 ? (
            <span className="shrink-0 text-muted-foreground">›</span>
          ) : null}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="shrink-0">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export interface DocsCrumb {
  label: string;
  href?: string;
}
