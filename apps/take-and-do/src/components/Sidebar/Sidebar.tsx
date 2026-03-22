"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon } from "@radix-ui/react-icons";
import { Dropdown } from "@/components/Dropdown";
import { SunIcon } from "@/components/Icons";
import { signOut, useSession } from "@/lib/auth-client";
import {
  SidebarContainer,
  Logo,
  Nav,
  NavButton,
  BottomActions,
  Avatar,
} from "./Sidebar.ui";

interface SidebarProps {
  onNavigationChange: (page: string) => void;
}

const DEFAULT_AVATAR = "https://i.pravatar.cc/40?img=12";

export function Sidebar({ onNavigationChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

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
          isActive={isHomeActive}
          onClick={() => handleNavClick("home", "/home")}
        >
          <HomeIcon width={24} height={24} />
        </NavButton>
        <NavButton
          isActive={isTasksActive}
          onClick={() => handleNavClick("tasks", "/tasks")}
        >
          <Image width={24} height={24} src="/tasks.svg" alt="Tasks" />
        </NavButton>

        <NavButton disabled>
          <Image width={24} height={24} src="/calendar.svg" alt="Calendar" />
        </NavButton>

        <NavButton disabled>
          <Image width={24} height={24} src="/docs.svg" alt="Workspace" />
        </NavButton>
      </Nav>

      <BottomActions>
        <NavButton title="Toggle theme">
          <SunIcon size={20} />
        </NavButton>

        <Dropdown
          className="mt-2"
          menuOpensTo="right"
          trigger={
            <Avatar
              src={session?.user?.image ?? DEFAULT_AVATAR}
              alt={session?.user?.name ?? "Account"}
            />
          }
          options={[{ label: "Log out", value: "logout", danger: true }]}
          menuMinWidth={140}
          onChange={async (value) => {
            if (value !== "logout") return;
            await signOut();
            router.push("/login");
            router.refresh();
          }}
        />
      </BottomActions>
    </SidebarContainer>
  );
}
