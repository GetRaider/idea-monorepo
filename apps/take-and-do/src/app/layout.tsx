import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Theme } from "@radix-ui/themes";

import { AppToaster } from "@/components/AppToaster";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Take & Do",
    template: "Take & Do | %s",
  },
  description: "A modern productivity management application",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} flex h-full min-h-0 flex-col`}
        suppressHydrationWarning
      >
        <Theme
          appearance="dark"
          accentColor="gray"
          grayColor="gray"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-transparent"
          hasBackground={false}
          suppressHydrationWarning
        >
          <AppProviders>{children}</AppProviders>
        </Theme>
        <AppToaster />
      </body>
    </html>
  );
}
