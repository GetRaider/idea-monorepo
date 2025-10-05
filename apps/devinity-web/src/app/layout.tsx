"use client";

import { PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { usePathname } from "next/navigation";

import "./globals.css";
import AppShell from "./components/AppShell/AppShell.component";
import StyledComponentsRegistry from "../lib/styled-components-registry";

const inter = Inter({ subsets: ["latin"] });

export default function ({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <Theme
            accentColor="violet"
            grayColor="slate"
            scaling="90%"
            panelBackground="solid"
            className="radix-theme-with-gradient"
          >
            <LayoutWrapper>{children}</LayoutWrapper>
          </Theme>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}

function LayoutWrapper({ children }: Readonly<PropsWithChildren>) {
  const pathname = usePathname();

  // Don't show AppShell (sidebar/header) on sign-in page
  if (pathname === "/sign-in") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
