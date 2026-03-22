"use client";

import { Button, Container, Content, Subtitle, Title } from "./page.styles";

export default function App() {
  return (
    <Container>
      <Content>
        <Title>Take & Do</Title>
        <Subtitle>As simple as possible</Subtitle>
        <Button href="/home">Get Started</Button>
      </Content>
    </Container>
  );
}
