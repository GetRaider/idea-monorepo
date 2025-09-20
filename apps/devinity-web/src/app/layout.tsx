import { PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";

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
            <AppShell>{children}</AppShell>
          </Theme>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
