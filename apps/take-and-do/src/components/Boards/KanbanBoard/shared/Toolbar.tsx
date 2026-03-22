"use client";

import { useState, type ReactNode } from "react";
import {
  Toolbar as ToolbarBar,
  WorkspacePath,
  BoardTitleEmoji,
  WorkspacePathLeading,
  Actions,
  PopoverContainer,
  Popover,
  Row,
  Segmented,
  SegmentBtn,
  Divider,
  Footer,
} from "../KanbanBoard.ui";
import { CreateTaskButton } from "./CreateTaskButton";

interface ToolbarProps {
  workspaceTitle: string;
  /** Emoji string or icon (e.g. sidebar clock icons for Today / Tomorrow). */
  workspaceEmoji?: ReactNode;
  onCreateTask?: () => void;
  onCreateTaskWithAI?: () => void;
}

export function Toolbar({
  workspaceTitle,
  workspaceEmoji,
  onCreateTask,
  onCreateTaskWithAI,
}: ToolbarProps) {
  const [open] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");

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
        <PopoverContainer>
          {/* TODO: Enable board settings once buttons are working */}
          {/* <SettingsButton
            title="Board settings"
            onClick={() => setOpen((previous) => !previous)}
          >
            <Image
              src="/board-preference.svg"
              alt="Settings"
              width={20}
              height={20}
            />
          </SettingsButton> */}
          {open ? (
            <Popover>
              <Row>
                <Segmented>
                  <SegmentBtn
                    $active={viewMode === "list"}
                    onClick={() => setViewMode("list")}
                  >
                    <span>≡</span>
                    <span>List</span>
                  </SegmentBtn>
                  <SegmentBtn
                    $active={viewMode === "board"}
                    onClick={() => setViewMode("board")}
                  >
                    <span
                      style={{
                        border: "2px solid currentColor",
                        width: 14,
                        height: 14,
                        display: "inline-block",
                        borderRadius: 3,
                      }}
                    />
                    <span>Board</span>
                  </SegmentBtn>
                </Segmented>
              </Row>

              <Divider />

              <Footer>
                <button
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#cbd5e1",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setViewMode("board");
                  }}
                >
                  Reset
                </button>
              </Footer>
            </Popover>
          ) : null}
        </PopoverContainer>
      </Actions>
    </ToolbarBar>
  );
}
