"use client";

import { Button, IconButton, Tooltip } from "@radix-ui/themes";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContainer,
  TopRow,
  ToggleButton,
  NavGrid,
  SquareButton,
  Label,
  Icon,
} from "./Sidebar.styles";

type NavItem = {
  label: string;
  href: string;
  icon?: string; // path to image/icon
};

const navLinks: NavItem[] = [
  { label: "Home", href: "/home", icon: "/icons/home.svg" },
  { label: "Repositories", href: "/repos", icon: "/icons/repos.svg" },
  { label: "Users", href: "/users", icon: "/icons/users.svg" },
  { label: "Analytics", href: "/analytics", icon: "/icons/analytics.svg" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
    const event = new CustomEvent("sidebar:collapsed", { detail: next });
    window.dispatchEvent(event);
  }

  return (
    <SidebarContainer $collapsed={collapsed}>
      <TopRow>
        <ToggleButton size="2" variant="soft" onClick={toggle}>
          {collapsed ? "›" : "‹"}
        </ToggleButton>
      </TopRow>
      <NavGrid>
        {navLinks.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          const iconEl = link.icon ? (
            <Icon src={link.icon} alt="" width={20} height={20} />
          ) : null;
          const content = (
            <SquareButton
              asChild
              size="3"
              variant={isActive ? "solid" : "soft"}
              $collapsed={collapsed}
            >
              <Link href={link.href}>
                {iconEl}
                <Label $collapsed={collapsed}>{link.label}</Label>
              </Link>
            </SquareButton>
          );
          return (
            <li key={link.href}>
              {collapsed ? (
                <Tooltip content={link.label} side="right" delayDuration={200}>
                  {content}
                </Tooltip>
              ) : (
                content
              )}
            </li>
          );
        })}
      </NavGrid>
    </SidebarContainer>
  );
}

export default Sidebar;
