"use client";

import { PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { usePathname } from "next/navigation";

import "./globals.css";
import AppShell from "./components/AppShell/AppShell.component";

const inter = Inter({ subsets: ["latin"] });

export default function ({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Theme
          accentColor="violet"
          grayColor="slate"
          scaling="90%"
          panelBackground="solid"
          className="radix-theme-with-gradient"
        >
          <LayoutWrapper>{children}</LayoutWrapper>
        </Theme>
      </body>
    </html>
  );
}

function LayoutWrapper({ children }: Readonly<PropsWithChildren>) {
  const pathname = usePathname();

  if (pathname === "/sign-in") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
