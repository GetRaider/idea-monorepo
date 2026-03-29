"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown } from "@/components/Dropdown";
import { OverviewIcon, SunIcon } from "@/components/Icons";
import { signOutAndClear, useSession } from "@/lib/auth-client";
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

import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigationChange: (page: string) => void;
}

const iconsSet: Array<{
  label: string;
  path?: string;
  icon?: string;
}> = [
  { label: "Overview", path: "/overview" },
  { label: "Tasks", path: "/tasks/root", icon: "/tasks.svg" },
  { label: "Calendar", icon: "/calendar.svg" },
  { label: "Docs", icon: "/docs.svg" },
];

export function Sidebar({ onNavigationChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <SidebarContainer>
      <Logo src="/logo.svg" alt="Logo" />

      <Nav>
        {iconsSet.map((icon) => {
          const isActive = icon.path
            ? icon.label === "Tasks"
              ? pathname.startsWith("/tasks")
              : pathname === icon.path || pathname.startsWith(`${icon.path}/`)
            : false;
          const className = cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg border-0 bg-transparent transition-all duration-200 no-underline",
            !icon.path
              ? "cursor-not-allowed opacity-30"
              : "cursor-pointer opacity-100",
            isActive
              ? "bg-[#2a2a2a] text-indigo-500 before:absolute before:left-[-8px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-indigo-500 before:content-['']"
              : "text-[#888]",
            icon.path && !isActive && "hover:bg-[#2a2a2a] hover:text-white",
          );

          const inner =
            icon.label === "Overview" ? (
              <OverviewIcon size={22} className="text-current" />
            ) : icon.icon ? (
              <Image width={24} height={24} src={icon.icon} alt="" />
            ) : null;

          return icon.path ? (
            <Link
              key={icon.label}
              href={icon.path}
              className={className}
              title={icon.label}
              prefetch
              onClick={() => onNavigationChange(icon.label)}
            >
              {inner}
            </Link>
          ) : (
            <NavButton
              key={icon.label}
              disabled
              isActive={false}
              title={icon.label}
            >
              {inner}
            </NavButton>
          );
        })}
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
