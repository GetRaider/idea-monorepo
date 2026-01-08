"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import {
  Toolbar as ToolbarStyled,
  WorkspacePath,
  Actions,
  CreateButton,
  CreateButtonContainer,
  CreateButtonDropdown,
  CreateButtonDropdownItem,
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
  onCreateTaskWithAI?: () => void;
}

export function Toolbar({
  workspaceTitle,
  onCreateTask,
  onCreateTaskWithAI,
}: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleManualCreate = () => {
    setIsDropdownOpen(false);
    onCreateTask?.();
  };

  const handleAICreate = () => {
    setIsDropdownOpen(false);
    onCreateTaskWithAI?.();
  };

  return (
    <ToolbarStyled>
      <WorkspacePath>{workspaceTitle}</WorkspacePath>
      <Actions>
        <CreateButtonContainer ref={dropdownRef}>
          <CreateButton
            onMouseEnter={() => setIsDropdownOpen(true)}
            onClick={handleManualCreate}
          >
            <Image width={20} height={20} src="/plus.svg" alt="Create Task" />
            Create Task
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: isDropdownOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              <path
                d="M3 4.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CreateButton>
          {isDropdownOpen && (
            <CreateButtonDropdown onMouseLeave={() => setIsDropdownOpen(false)}>
              <CreateButtonDropdownItem onClick={handleAICreate}>
                AI
              </CreateButtonDropdownItem>
              <CreateButtonDropdownItem onClick={handleManualCreate}>
                Manual
              </CreateButtonDropdownItem>
            </CreateButtonDropdown>
          )}
        </CreateButtonContainer>
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
