"use client";

import type { ComponentProps } from "react";

import {
  sidebarFolderDraggableId,
  sidebarFolderDroppableId,
  type SidebarFolderDraggableData,
  type SidebarFolderTargetDroppableData,
  useDraggable,
  useDroppable,
} from "@/lib/board-dnd";
import { cn } from "@/lib/styles/utils";
import type { Folder } from "@/types/workspace";

import { FolderDropTarget, WorkspaceToggle } from "./TasksSidebar.ui";

type SidebarFolderDropTargetProps = ComponentProps<typeof FolderDropTarget> & {
  folderId: string;
};

export function SidebarFolderDropTarget({
  folderId,
  children,
  ...rest
}: SidebarFolderDropTargetProps) {
  const { setNodeRef } = useDroppable({
    id: sidebarFolderDroppableId(folderId),
    data: {
      type: "sidebar-folder-target",
      folderId,
    } satisfies SidebarFolderTargetDroppableData,
  });

  return (
    <FolderDropTarget ref={setNodeRef} {...rest}>
      {children}
    </FolderDropTarget>
  );
}

type SidebarFolderDragToggleProps = ComponentProps<typeof WorkspaceToggle> & {
  folder: Folder;
  editingFolderId: string | null;
};

export function SidebarFolderDragToggle({
  folder,
  editingFolderId,
  className,
  ...props
}: SidebarFolderDragToggleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: sidebarFolderDraggableId(folder.id),
    data: {
      type: "sidebar-folder",
      folderId: folder.id,
    } satisfies SidebarFolderDraggableData,
    disabled: editingFolderId === folder.id,
  });

  return (
    <WorkspaceToggle
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(className, isDragging && "opacity-0")}
      {...props}
    />
  );
}
