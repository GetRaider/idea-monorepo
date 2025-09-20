"use client";

import { Button } from "@repo/ui/components/Button/Button.component";
import { Main, Content, MainTitle, Description } from "./page.styles";

export default function HomePage() {
  return (
    <Main>
      <Content>
        <MainTitle>Welcome to Devinity!</MainTitle>
        <Description>Your engineering team's manager</Description>
        <Button>Get Started</Button>
      </Content>
    </Main>
  );
}
