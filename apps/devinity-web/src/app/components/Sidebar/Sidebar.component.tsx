"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";

type NavItem = {
  label: string;
  href: string;
  icon?: string;
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
    function handleSidebarCollapse(event: CustomEvent<boolean>) {
      setCollapsed(event.detail);
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
    <aside
      className={cn(
        "sticky top-16 flex h-[calc(100vh-4rem)] flex-col gap-4 border-r border-slate-400/25 bg-slate-800 p-4 transition-[width] duration-200 ease-out lg:static",
        collapsed ? "w-20" : "w-[260px]",
        "max-lg:fixed max-lg:left-0 max-lg:top-16 max-lg:z-50",
      )}
    >
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const iconElement = link.icon ? (
            <Image
              src={link.icon}
              alt=""
              width={20}
              height={20}
              className="opacity-90"
            />
          ) : null;
          return (
            <li key={link.href}>
              <Link href={link.href} className="no-underline">
                <button
                  type="button"
                  title={collapsed ? link.label : undefined}
                  className={cn(
                    "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border-none px-3 font-medium tracking-wide",
                    collapsed ? "justify-center" : "justify-start",
                    isActive
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-transparent text-slate-300 hover:bg-slate-700",
                  )}
                >
                  {iconElement}
                  <span
                    className={cn(
                      "whitespace-nowrap font-medium text-inherit",
                      collapsed ? "hidden" : "inline",
                    )}
                  >
                    {link.label}
                  </span>
                </button>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Sidebar;
