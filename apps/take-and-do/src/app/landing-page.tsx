"use client";

import { Route } from "@/constants/route.constant";
import {
  GetStartedLink,
  LandingContent,
  LandingPageRoot,
  LandingSubtitle,
  LandingTitle,
} from "./shell.ui";

export function LandingPage() {
  return (
    <LandingPageRoot>
      <LandingContent>
        <LandingTitle>Take & Do</LandingTitle>
        <LandingSubtitle>As simple as possible</LandingSubtitle>
        <GetStartedLink href={Route.LOGIN}>Get Started</GetStartedLink>
      </LandingContent>
    </LandingPageRoot>
  );
}
