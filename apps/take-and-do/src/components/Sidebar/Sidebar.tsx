"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon } from "@radix-ui/react-icons";
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
  const pathname = usePathname();
  const router = useRouter();
  const [activePage, setActivePage] = useState(
    pathname === "/home" ? "home" : pathname === "/tasks" ? "tasks" : "home",
  );

  const handleNavClick = (page: string, path: string) => {
    setActivePage(page);
    onNavigationChange(page);
    router.push(path);
  };

  // Determine active state based on pathname
  const isHomeActive = pathname === "/home" || pathname === "/";
  const isTasksActive = pathname === "/tasks";

  return (
    <SidebarContainer>
      <Logo src="/logo.svg" alt="Logo" />

      <Nav>
        <NavButton
          $active={isHomeActive}
          onClick={() => handleNavClick("home", "/home")}
        >
          <HomeIcon width={24} height={24} />
        </NavButton>
        <NavButton
          $active={isTasksActive}
          onClick={() => handleNavClick("tasks", "/tasks")}
        >
          <img width={24} height={24} src="/tasks.svg" alt="Tasks" />
        </NavButton>

        <NavButton disabled>
          <img width={24} height={24} src="/calendar.svg" alt="Calendar" />
        </NavButton>

        <NavButton disabled>
          <img width={24} height={24} src="/docs.svg" alt="Workspace" />
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
