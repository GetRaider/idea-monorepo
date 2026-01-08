"use client";

import { usePathname, useRouter } from "next/navigation";
import { HomeIcon } from "@radix-ui/react-icons";
import {
  SidebarContainer,
  Logo,
  Nav,
  NavButton,
  BottomActions,
  UserAvatar,
  Avatar,
} from "./Sidebar.styles";

interface SidebarProps {
  onNavigationChange: (page: string) => void;
}

export default function Sidebar({ onNavigationChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (page: string, path: string) => {
    onNavigationChange(page);
    if (!pathname.startsWith(path)) {
      router.push(path);
    }
  };

  const isHomeActive = pathname === "/home" || pathname === "/";
  const isTasksActive = pathname.startsWith("/tasks");

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

        <UserAvatar>
          <Avatar src="https://i.pravatar.cc/40?img=12" alt="User" />
        </UserAvatar>
      </BottomActions>
    </SidebarContainer>
  );
}
