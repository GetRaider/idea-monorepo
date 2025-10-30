"use client";

import {
  HeaderContainer,
  Content,
  Title,
  Actions,
  IconButton,
} from "./Header.styles";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <HeaderContainer>
      <Content>
        <Title>{title}</Title>
      </Content>
    </HeaderContainer>
  );
}
