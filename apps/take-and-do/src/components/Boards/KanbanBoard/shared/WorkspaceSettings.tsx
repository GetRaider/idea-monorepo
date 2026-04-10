"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { InfoCircleIcon, PublicWorkspaceIcon } from "@/components/Icons";
import { Switch } from "@/components/Switch/Switch";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { clientServices } from "@/services";
import { toast } from "sonner";

import { PopoverContainer, Popover, SettingsButton } from "../KanbanBoard.ui";

export function WorkspaceSettings({ boardId }: WorkspaceSettingsProps) {
  const isAnonymous = useIsAnonymous();
  const { taskBoards, setTaskBoards } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingPublic, setIsSavingPublic] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isPublic = useMemo(
    () => taskBoards.find((entry) => entry.id === boardId)?.isPublic ?? false,
    [taskBoards, boardId],
  );

  useEffect(() => {
    if (!settingsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [settingsOpen]);

  const handlePublicToggle = useCallback(
    async (toPublic: boolean) => {
      if (isSavingPublic) return;
      setIsSavingPublic(true);
      try {
        const board = taskBoards.find((entry) => entry.id === boardId);
        if (isAnonymous && !board) {
          toast.error("Board not loaded");
          return;
        }
        const updated = await clientServices.taskBoards.changeVisibility({
          id: boardId,
          toPublic: toPublic,
          boardSnapshot: board,
          skipCascade: isAnonymous,
        });
        if (!updated) {
          toast.error("Can't update workspace visibility");
          return;
        }
        setTaskBoards((previous) =>
          previous.map((entry) => (entry.id === boardId ? updated : entry)),
        );
      } finally {
        setIsSavingPublic(false);
      }
    },
    [boardId, isSavingPublic, setTaskBoards, taskBoards, isAnonymous],
  );

  const options = [
    {
      label: "Public Workspace",
      icon: <PublicWorkspaceIcon size={20} className="text-text-primary" />,
      checked: isPublic,
      onChange: (toPublic: boolean) => void handlePublicToggle(toPublic),
      tooltip:
        "When enabled, guest users can interact with this board without signing in.",
    },
    // {
    //   label: "List Board / Kanban Board",
    //   icon: <ListBoardIcon size={20} className="text-text-primary" />,
    //   checked: isListBoard,
    //   onChange: (next: boolean) => void handleListBoardToggle(next),
    //   tooltip: "TODO",
    // },
  ];

  return (
    <PopoverContainer ref={popoverRef}>
      <SettingsButton
        type="button"
        title="Board settings"
        aria-expanded={settingsOpen}
        aria-haspopup="dialog"
        onClick={() => setSettingsOpen((previous) => !previous)}
      >
        <Image src="/board-preference.svg" alt="" width={20} height={20} />
      </SettingsButton>
      {settingsOpen ? (
        <Popover
          role="dialog"
          aria-label="Manage settings"
          className="w-[min(100vw-2rem,420px)] rounded-2xl border-border-app bg-card-bg p-6 text-text-primary shadow-dropdown"
        >
          <header className="border-b border-border-app pb-4">
            <h2 className="m-0 text-lg font-semibold leading-tight text-text-primary">
              Manage Settings
            </h2>
            <p className="mt-1.5 m-0 text-sm leading-snug text-text-secondary">
              Manage settings for a workspace.
            </p>
          </header>

          <ul className="m-0 list-none divide-y divide-border-app p-0">
            {options.map((option, index) => (
              <li key={index} className="flex items-center gap-4 py-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-input-bg"
                  aria-hidden
                >
                  {option.icon}
                </div>
                <div className="min-w-0 flex flex-1 flex-wrap items-center gap-1.5">
                  <span
                    id="workspace-public-label"
                    className="text-sm font-semibold text-text-primary"
                  >
                    {option.label}
                  </span>
                  <AppTooltip content={option.tooltip}>
                    <button
                      type="button"
                      className="inline-flex shrink-0 cursor-help items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      aria-label="About public workspace"
                    >
                      <InfoCircleIcon size={14} />
                    </button>
                  </AppTooltip>
                </div>
                <Switch
                  checked={option.checked}
                  onCheckedChange={(toPublic) => {
                    console.log("toPublic", toPublic);
                    void option.onChange(toPublic);
                  }}
                  disabled={isAnonymous || isSavingPublic}
                  size="sm"
                  aria-labelledby="workspace-public-label"
                />
              </li>
            ))}
          </ul>
        </Popover>
      ) : null}
    </PopoverContainer>
  );
}

interface WorkspaceSettingsProps {
  boardId: string;
}
