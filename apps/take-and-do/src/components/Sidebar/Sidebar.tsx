"use client";

import { usePathname, useRouter } from "next/navigation";
import { HomeIcon } from "@radix-ui/react-icons";
import { SunIcon } from "@/components/Icons";
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
          <SunIcon size={20} />
        </NavButton>

        <UserAvatar>
          <Avatar src="https://i.pravatar.cc/40?img=12" alt="User" />
        </UserAvatar>
      </BottomActions>
    </SidebarContainer>
  );
}
