"use client";

import { useState } from "react";
import {
  SidebarContainer,
  Logo,
  LogoCircle,
  Nav,
  NavButton,
  BottomActions,
  NotificationBadge,
  UserAvatar,
  Avatar,
} from "./Sidebar.styles";

interface SidebarProps {
  onNavigationChange: (page: string) => void;
}

export default function Sidebar({ onNavigationChange }: SidebarProps) {
  const [activePage, setActivePage] = useState("tasks");

  const handleNavClick = (page: string) => {
    if (page === "tasks") {
      setActivePage(page);
      onNavigationChange(page);
    }
  };

  return (
    <SidebarContainer>
      <Logo src="/logo.svg" alt="Logo" />

      <Nav>
        <NavButton
          $active={activePage === "tasks"}
          onClick={() => handleNavClick("tasks")}
          title="Tasks"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </NavButton>

        <NavButton disabled title="Calendar (disabled)">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="5"
              width="16"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path d="M4 9h16" stroke="currentColor" strokeWidth="2" />
            <path
              d="M9 3v4M15 3v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </NavButton>

        <NavButton disabled title="Workspace (disabled)">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 8h16M4 16h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </NavButton>

        <NavButton disabled title="Settings (disabled)">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M12 1v6m0 6v10M23 12h-6m-2 0H1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </NavButton>
      </Nav>

      <BottomActions>
        <NavButton title="Toggle theme">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.66 4.34l-1.41 1.41M5.75 14.25l-1.41 1.41M15.66 15.66l-1.41-1.41M5.75 5.75l-1.41-1.41"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </NavButton>

        <NavButton title="Notifications">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 7A5 5 0 0 0 5 7c0 4-2 5-2 5h14s-2-1-2-5ZM11.73 16a2 2 0 0 1-3.46 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <NotificationBadge>3</NotificationBadge>
        </NavButton>

        <UserAvatar>
          <Avatar src="https://i.pravatar.cc/40?img=12" alt="User" />
        </UserAvatar>
      </BottomActions>
    </SidebarContainer>
  );
}
