"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import {
  Toolbar as ToolbarBar,
  WorkspacePath,
  BoardTitleEmoji,
  WorkspacePathLeading,
  Actions,
  PopoverContainer,
  Popover,
  Row,
  SettingsButton,
  Label,
} from "../KanbanBoard.ui";
import { CreateTaskButton } from "./CreateTaskButton";

interface ToolbarProps {
  workspaceTitle: string;
  /** Emoji string or icon (e.g. sidebar clock icons for Today / Tomorrow). */
  workspaceEmoji?: ReactNode;
  onCreateTask?: () => void;
  onCreateTaskWithAI?: () => void;
  /** Single-board view: workspace visibility toggle (hidden for anonymous users). */
  boardSettings?: {
    isPublic: boolean;
    onIsPublicChange: (next: boolean) => Promise<void>;
  };
}

export function Toolbar({
  workspaceTitle,
  workspaceEmoji,
  onCreateTask,
  onCreateTaskWithAI,
  boardSettings,
}: ToolbarProps) {
  const isAnonymous = useIsAnonymous();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingPublic, setIsSavingPublic] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [settingsOpen]);

  const showBoardSettings = Boolean(boardSettings) && !isAnonymous;

  const handlePublicToggle = async (next: boolean) => {
    if (!boardSettings || isSavingPublic) return;
    setIsSavingPublic(true);
    try {
      await boardSettings.onIsPublicChange(next);
    } finally {
      setIsSavingPublic(false);
    }
  };

  return (
    <ToolbarBar>
      <WorkspacePath>
        {workspaceEmoji != null && workspaceEmoji !== "" ? (
          <WorkspacePathLeading aria-hidden>
            {typeof workspaceEmoji === "string" ? (
              <BoardTitleEmoji>{workspaceEmoji}</BoardTitleEmoji>
            ) : (
              workspaceEmoji
            )}
          </WorkspacePathLeading>
        ) : null}
        {workspaceTitle}
      </WorkspacePath>
      <Actions>
        <CreateTaskButton
          onManualCreate={onCreateTask}
          onAICreate={onCreateTaskWithAI}
        />
        {showBoardSettings && boardSettings ? (
          <PopoverContainer ref={popoverRef}>
            <SettingsButton
              type="button"
              title="Board settings"
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              onClick={() => setSettingsOpen((previous) => !previous)}
            >
              <Image
                src="/board-preference.svg"
                alt=""
                width={20}
                height={20}
              />
            </SettingsButton>
            {settingsOpen ? (
              <Popover role="dialog" aria-label="Board settings">
                <Row>
                  <Label id="workspace-public-label" className="text-sm">
                    Public workspace
                  </Label>
                  <button
                    type="button"
                    aria-labelledby="workspace-public-label"
                    role="switch"
                    aria-checked={boardSettings.isPublic}
                    disabled={isSavingPublic}
                    onClick={() =>
                      void handlePublicToggle(!boardSettings.isPublic)
                    }
                    className="relative size-1 h-7 w-12 shrink-0 rounded-full border-0 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-50"
                    style={{
                      backgroundColor: boardSettings.isPublic
                        ? "rgb(114 85 193)"
                        : "rgb(55 55 55)",
                    }}
                  >
                    <span
                      className="pointer-events-none absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200"
                      style={{
                        left: boardSettings.isPublic ? "26px" : "2px",
                      }}
                    />
                  </button>
                </Row>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  When enabled, guest users can view this board without signing
                  in.
                </p>
              </Popover>
            ) : null}
          </PopoverContainer>
        ) : null}
      </Actions>
    </ToolbarBar>
  );
}
