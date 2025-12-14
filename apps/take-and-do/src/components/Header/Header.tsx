"use client";

import { HeaderContainer, Content, Title } from "./Header.styles";

export default function Header({ title }: HeaderProps) {
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
