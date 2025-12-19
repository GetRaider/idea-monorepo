"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Toolbar as ToolbarStyled,
  WorkspacePath,
  Actions,
  CreateButton,
  SettingsButton,
  PopoverContainer,
  Popover,
  Row,
  Segmented,
  SegmentBtn,
  Divider,
  Footer,
} from "../KanbanBoard.styles";

interface ToolbarProps {
  workspaceTitle: string;
  onCreateTask?: () => void;
}

export function Toolbar({ workspaceTitle, onCreateTask }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");

  return (
    <ToolbarStyled>
      <WorkspacePath>{workspaceTitle}</WorkspacePath>
      <Actions>
        <CreateButton onClick={onCreateTask}>
          <Image width={20} height={20} src="/plus.svg" alt="Create Task" />
          Create Task
        </CreateButton>
        <PopoverContainer>
          {/* TODO: Enable board settings once buttons are working */}
          {/* <SettingsButton
            title="Board settings"
            onClick={() => setOpen((s) => !s)}
          >
            <Image
              src="/board-preference.svg"
              alt="Settings"
              width={20}
              height={20}
            />
          </SettingsButton> */}
          {open && (
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
          )}
        </PopoverContainer>
      </Actions>
    </ToolbarStyled>
  );
}
