"use client";

import { HeaderContainer, Content, Title } from "./Header.ui";

export function Header({ title }: HeaderProps) {
  return (
    <HeaderContainer>
      <Content>
        <Title>{title}</Title>
      </Content>
    </HeaderContainer>
  );
}

interface HeaderProps {
  title: string;
}
