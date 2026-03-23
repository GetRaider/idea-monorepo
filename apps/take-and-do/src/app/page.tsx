"use client";

import {
  GetStartedLink,
  LandingContent,
  LandingPageRoot,
  LandingSubtitle,
  LandingTitle,
} from "./shell.ui";

export default function App() {
  return (
    <LandingPageRoot>
      <LandingContent>
        <LandingTitle>Take & Do</LandingTitle>
        <LandingSubtitle>As simple as possible</LandingSubtitle>
        <GetStartedLink href="/login">Get Started</GetStartedLink>
      </LandingContent>
    </LandingPageRoot>
  );
}
