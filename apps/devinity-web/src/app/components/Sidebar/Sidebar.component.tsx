"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContainer,
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
  { label: "Home", href: "/", icon: "/icons/home.svg" },
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

  useEffect(() => {
    function handleSidebarCollapse(e: CustomEvent) {
      setCollapsed(e.detail);
    }

    window.addEventListener(
      "sidebar:collapsed",
      handleSidebarCollapse as EventListener,
    );
    return () =>
      window.removeEventListener(
        "sidebar:collapsed",
        handleSidebarCollapse as EventListener,
      );
  }, []);

  return (
    <SidebarContainer $collapsed={collapsed}>
      <NavGrid>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const iconEl = link.icon ? (
            <Icon src={link.icon} alt="" width={20} height={20} />
          ) : null;
          const content = (
            <Link href={link.href} style={{ textDecoration: "none" }}>
              <SquareButton
                $variant={isActive ? "solid" : undefined}
                $collapsed={collapsed}
                title={collapsed ? link.label : undefined}
              >
                {iconEl}
                <Label $collapsed={collapsed}>{link.label}</Label>
              </SquareButton>
            </Link>
          );
          return <li key={link.href}>{content}</li>;
        })}
      </NavGrid>
    </SidebarContainer>
  );
}

export default Sidebar;
