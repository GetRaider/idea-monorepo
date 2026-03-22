import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Theme } from "@radix-ui/themes";

import { Analytics } from "@/components/Analytics";
import { GuestBanner } from "@/components/GuestBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Take & Do - Productivity Management",
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
      <body className={inter.variable} suppressHydrationWarning>
        <Theme>
          <Analytics />
          <GuestBanner />
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            closeButton
            toastOptions={{ duration: 5000 }}
          />
        </Theme>
      </body>
    </html>
  );
}
