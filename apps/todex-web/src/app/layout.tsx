import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { QueryProvider } from "../providers/query-provider";
import { AppFrame } from "../components/AppFrame";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Todex",
  description: "Tasks, calendar, and docs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <AppFrame>{children}</AppFrame>
        </QueryProvider>
      </body>
    </html>
  );
}
