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
        <Actions>
          <IconButton title="Filter">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 6h14M6 10h8M8 14h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        </Actions>
      </Content>
    </HeaderContainer>
  );
}
