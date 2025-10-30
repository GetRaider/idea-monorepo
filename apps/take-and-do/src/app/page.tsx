"use client";

import Link from "next/link";
import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Content = styled.div`
  text-align: center;
  color: #fff;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #cbd5e1;
  margin-bottom: 32px;
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 14px 28px;
  background: #7255c1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #5a42a1;
    transform: translateY(-2px);
  }
`;

export default function Home() {
  return (
    <Container>
      <Content>
        <Title>Take & Do</Title>
        <Subtitle>Task Management Made Simple</Subtitle>
        <Button href="/tasks">Get Started</Button>
      </Content>
    </Container>
  );
}
