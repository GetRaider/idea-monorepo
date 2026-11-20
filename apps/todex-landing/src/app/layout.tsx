import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { HOME_COPY } from "@/content/home";

import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Todex | From idea to execution",
  description: HOME_COPY.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
