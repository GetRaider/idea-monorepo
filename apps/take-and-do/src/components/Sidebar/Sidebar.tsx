"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { GuestAvatarIcon } from "../Icons/GuestAvatarIcon";
import { DefaultAvatarIcon } from "../Icons/DefaulAvatarIcon";
import { UserWithAnonymous } from "better-auth/plugins";

interface SidebarProps {
  onNavigationChange: (page: string) => void;
}

const iconsSet = [
  {
    label: "Home",
    icon: "/home.svg",
    path: "/home",
  },
  {
    label: "Tasks",
    icon: "/tasks.svg",
    path: "/tasks",
  },
  {
    label: "Calendar",
    icon: "/calendar.svg",
    path: undefined,
  },
  {
    label: "Docs",
    icon: "/docs.svg",
    path: undefined,
  },
];

export function Sidebar({ onNavigationChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleNavClick = (page: string, path: string) => {
    onNavigationChange(page);
    if (!pathname.startsWith(path)) router.push(path);
  };

  return (
    <SidebarContainer>
      <Logo src="/logo.svg" alt="Logo" />

      <Nav>
        {iconsSet.map((icon) => (
          <NavButton
            disabled={!icon.path}
            key={icon.label}
            isActive={icon.path ? pathname.startsWith(icon.path) : false}
            onClick={() => handleNavClick(icon.label, icon?.path ?? "")}
          >
            <Image width={24} height={24} src={icon.icon} alt={icon.label} />
          </NavButton>
        ))}
      </Nav>

      <BottomActions>
        <NavButton title="Toggle theme">
          <SunIcon size={20} />
        </NavButton>

        <Dropdown
          className="mt-2"
          menuOpensTo="right"
          trigger={getAvatarIcon(session?.user as UserWithAnonymous)}
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

function getAvatarIcon(user: UserWithAnonymous | undefined): React.ReactNode {
  if (user?.isAnonymous) return <GuestAvatarIcon size={36} />;
  if (user?.image) {
    return <Avatar src={user.image} alt={user.name ?? "Account"} />;
  }
  if (!user) return <DefaultAvatarIcon size={36} />;
}
