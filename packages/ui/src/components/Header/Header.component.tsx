"use client";

import {
  Avatar,
  Button,
  DropdownMenu,
  Link,
  IconButton,
} from "@radix-ui/themes";
import { PropsWithChildren, useState, useEffect } from "react";

import { cn } from "../../lib/cn";

export type HeaderProps = PropsWithChildren<{
  userName?: string;
  userEmail?: string;
  userImageUrl?: string;
  onProfileClick?: () => void;
  onSignOut?: () => void;
  rightSlot?: React.ReactNode;
  hideBrandText?: boolean;
}>;

export default function Header({
  userName,
  userEmail,
  userImageUrl,
  onProfileClick,
  onSignOut,
  rightSlot,
  hideBrandText,
}: HeaderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  const initials = (userName || userEmail || "U")
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

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
    <header className="sticky top-0 z-[100] w-full border-b border-slate-400/10 bg-slate-900/95 p-0 backdrop-blur-md">
      <div className="mx-0 flex h-16 w-full items-center justify-between px-8 max-md:h-14 max-md:pr-2 max-md:pl-0">
        <div className="-ml-[15px] flex items-center">
          <Link
            href="/"
            className="relative flex items-center gap-3 text-inherit no-underline transition-opacity hover:opacity-80"
            onMouseEnter={() => setShowToggle(true)}
            onMouseLeave={() => setShowToggle(false)}
          >
            <img
              src="/devinity-logo.png"
              alt="Devinity Logo"
              width={48}
              height={48}
              className="rounded-lg object-contain"
            />
            <span
              className={cn(
                "text-xl font-semibold tracking-tight text-slate-50 max-md:text-lg",
                hideBrandText && "hidden",
              )}
            >
              Devinity
            </span>
            <IconButton
              size="2"
              variant="soft"
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                toggle();
              }}
              className={cn(
                "absolute inset-0 z-10 inline-flex h-12 min-w-[48px] items-center justify-center rounded-lg border-none bg-slate-600/90 p-0 text-slate-300 transition-[opacity,visibility] hover:bg-slate-500/90",
                showToggle ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="2"
                  y="2"
                  width="12"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </IconButton>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {rightSlot}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button
                type="button"
                aria-label="User menu"
                className="cursor-pointer rounded-full border-none bg-transparent p-1"
              >
                <Avatar
                  size="2"
                  src={userImageUrl}
                  fallback={initials}
                  radius="full"
                />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" variant="soft">
              {userName || userEmail ? (
                <DropdownMenu.Group>
                  <DropdownMenu.Label>
                    {userName || userEmail}
                  </DropdownMenu.Label>
                  <DropdownMenu.Item onSelect={onProfileClick}>
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item color="red" onSelect={onSignOut}>
                    Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              ) : (
                <DropdownMenu.Item asChild>
                  <Button size="2" variant="soft">
                    Sign in
                  </Button>
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
