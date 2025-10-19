"use client";

import { useState } from "react";
import {
  NavigationSidebarContainer,
  Search,
  SearchInput,
  Nav,
  NavItem,
  Workspace,
  WorkspaceHeader,
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  Chevron,
  SubItems,
  SubItem,
} from "./NavigationSidebar.styles";

interface NavigationSidebarProps {
  isOpen: boolean;
}

export default function NavigationSidebar({ isOpen }: NavigationSidebarProps) {
  const [activeView, setActiveView] = useState("today");
  const [expandedWorkspace, setExpandedWorkspace] = useState("work");

  const toggleWorkspace = (workspace: string) => {
    setExpandedWorkspace(expandedWorkspace === workspace ? "" : workspace);
  };

  return (
    <NavigationSidebarContainer $isOpen={isOpen}>
      <Search>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle
            cx="6.5"
            cy="6.5"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M10 10l4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <SearchInput type="text" placeholder="Search..." />
      </Search>

      <Nav>
        <NavItem
          $active={activeView === "today"}
          onClick={() => setActiveView("today")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M10 6v4l3 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Today</span>
        </NavItem>

        <NavItem
          $active={activeView === "tomorrow"}
          onClick={() => setActiveView("tomorrow")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <span>Tomorrow</span>
        </NavItem>
      </Nav>

      <Workspace>
        <WorkspaceHeader>Workspace</WorkspaceHeader>

        <WorkspaceList>
          <WorkspaceItem>
            <WorkspaceToggle onClick={() => toggleWorkspace("personal")}>
              <Chevron
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                $expanded={expandedWorkspace === "personal"}
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Chevron>
              <span>Personal</span>
            </WorkspaceToggle>
            {expandedWorkspace === "personal" && (
              <SubItems>{/* Sub-items can be added here */}</SubItems>
            )}
          </WorkspaceItem>

          <WorkspaceItem>
            <WorkspaceToggle onClick={() => toggleWorkspace("work")}>
              <Chevron
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                $expanded={expandedWorkspace === "work"}
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Chevron>
              <span>Work</span>
            </WorkspaceToggle>
            {expandedWorkspace === "work" && (
              <SubItems>{/* Sub-items can be added here */}</SubItems>
            )}
          </WorkspaceItem>

          <WorkspaceItem>
            <WorkspaceToggle onClick={() => toggleWorkspace("sport")}>
              <Chevron
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                $expanded={expandedWorkspace === "sport"}
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Chevron>
              <span>Sport</span>
            </WorkspaceToggle>
            {expandedWorkspace === "sport" && (
              <SubItems>
                <SubItem>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="4"
                      y="4"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                  <span>Running</span>
                </SubItem>
                <SubItem>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="4"
                      y="4"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                  <span>Gym</span>
                </SubItem>
                <SubItem>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="4"
                      y="4"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                  <span>Swimming</span>
                </SubItem>
              </SubItems>
            )}
          </WorkspaceItem>
        </WorkspaceList>
      </Workspace>
    </NavigationSidebarContainer>
  );
}
