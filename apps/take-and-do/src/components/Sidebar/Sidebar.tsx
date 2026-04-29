"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserWithAnonymous } from "better-auth/plugins";

import { Dropdown } from "@/components/Dropdown";
import { OverviewIcon, SunIcon } from "@/components/Icons";
import { signOutAndClear, useSession } from "@/auth/client";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
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
import { Route } from "@/constants/route.constant";

const buttonsSet: Array<{
  label: string;
  icon: string | React.ReactNode;
  path: string | null;
}> = [
  {
    label: "Overview",
    icon: <OverviewIcon size={24} className="text-white" />,
    path: Route.OVERVIEW,
  },
  {
    label: "Tasks",
    icon: "/tasks.svg",
    path: Route.TASKS,
  },
  {
    label: "Calendar",
    icon: "/calendar.svg",
    path: null,
  },
  {
    label: "Docs",
    icon: "/docs.svg",
    path: null,
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
        {buttonsSet.map((button) => (
          <AppTooltip
            key={button.label}
            content={
              button.path ? button.label : `${button.label} - Coming Soon`
            }
            side="right"
          >
            <span className="inline-flex">
              <NavButton
                disabled={!button.path}
                isActive={
                  button.path ? pathname.startsWith(button.path) : false
                }
                onClick={() =>
                  button.path && handleNavClick(button.label, button.path)
                }
              >
                {typeof button.icon === "string" ? (
                  <Image
                    width={24}
                    height={24}
                    src={button.icon}
                    alt={button.label}
                  />
                ) : (
                  button.icon
                )}
              </NavButton>
            </span>
          </AppTooltip>
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
            await signOutAndClear();
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

interface SidebarProps {
  onNavigationChange: (page: string) => void;
}
