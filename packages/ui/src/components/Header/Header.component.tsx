"use client";

import { Avatar, Button, DropdownMenu } from "@radix-ui/themes";
import { PropsWithChildren, useState, useEffect } from "react";
import {
  HeaderContainer,
  Container,
  LogoContainer,
  LogoLink,
  Logo,
  BrandName,
  Actions,
  AvatarButton,
  ToggleButton,
} from "./Header.styles";

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
    .map((s) => s.charAt(0).toUpperCase())
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
    <HeaderContainer>
      <Container>
        <LogoContainer>
          <LogoLink
            href="/"
            onMouseEnter={() => setShowToggle(true)}
            onMouseLeave={() => setShowToggle(false)}
          >
            <Logo
              src="/denzel-logo-v2.png"
              alt="Denzel Logo"
              width={48}
              height={48}
            />
            <BrandName $hidden={hideBrandText || false}>Devinity</BrandName>
            <ToggleButton
              size="2"
              variant="soft"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                toggle();
              }}
              $show={showToggle}
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
            </ToggleButton>
          </LogoLink>
        </LogoContainer>

        <Actions>
          {rightSlot}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <AvatarButton aria-label="User menu">
                <Avatar
                  size="2"
                  src={userImageUrl}
                  fallback={initials}
                  radius="full"
                />
              </AvatarButton>
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
        </Actions>
      </Container>
    </HeaderContainer>
  );
}
