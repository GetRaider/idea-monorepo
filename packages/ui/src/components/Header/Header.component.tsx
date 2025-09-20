"use client";

import { Avatar, Button, DropdownMenu, Link } from "@radix-ui/themes";
import { PropsWithChildren } from "react";
import {
  HeaderContainer,
  Container,
  LogoContainer,
  LogoLink,
  Logo,
  BrandName,
  Actions,
  AvatarButton,
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
  const initials = (userName || userEmail || "U")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <HeaderContainer>
      <Container>
        <LogoContainer>
          <LogoLink href="/">
            <Logo
              src="/denzel-logo-v2.png"
              alt="Denzel Logo"
              width={40}
              height={40}
            />
            <BrandName $hidden={hideBrandText || false}>Devinity</BrandName>
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
