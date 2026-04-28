import type { CollisionDetection } from "@dnd-kit/core";
import { pointerWithin, rectIntersection } from "@dnd-kit/core";

import type { SidebarDraggableData, SidebarDroppableData } from "./sidebar";

/**
 * Sidebar DnD: folder vs board vs nested folder lists need predictable priority.
 */
export const sidebarCollisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length === 0) {
    return rectIntersection(args);
  }
  const dataFor = (id: string | number) =>
    args.droppableContainers.find((c) => c.id === id)?.data.current as
      | SidebarDroppableData
      | undefined;

  const activeData = args.active.data.current as
    | SidebarDraggableData
    | undefined;

  const topInsert = hits.filter((h) => {
    const d = dataFor(h.id);
    return (
      d?.type === "sidebar-top-insert" || d?.type === "sidebar-top-insert-end"
    );
  });

  const boardInsert = hits.filter(
    (h) => dataFor(h.id)?.type === "sidebar-board-insert",
  );

  const folderTargets = hits.filter(
    (h) => dataFor(h.id)?.type === "sidebar-folder-target",
  );

  if (activeData?.type === "sidebar-folder") {
    if (topInsert.length > 0) return topInsert;
    if (folderTargets.length > 0) return folderTargets;
    return hits;
  }

  if (activeData?.type === "sidebar-board") {
    const srcFolderId = activeData.folderId;

    if (srcFolderId != null) {
      const sameFolderIns = boardInsert.filter((h) => {
        const d = dataFor(h.id);
        return (
          d?.type === "sidebar-board-insert" && d.folderScope === srcFolderId
        );
      });
      if (sameFolderIns.length > 0) return sameFolderIns;
      if (topInsert.length > 0) return topInsert;
      if (folderTargets.length > 0) return folderTargets;
      return hits;
    }

    const rootBoardIns = boardInsert.filter((h) => {
      const d = dataFor(h.id);
      return d?.type === "sidebar-board-insert" && d.folderScope === null;
    });
    if (rootBoardIns.length > 0) return rootBoardIns;

    if (topInsert.length > 0) return topInsert;
    if (folderTargets.length > 0) return folderTargets;
    return hits;
  }

  if (boardInsert.length > 0) return boardInsert;
  if (folderTargets.length > 0) return folderTargets;

  return hits;
};
