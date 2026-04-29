import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppToaster } from "@/components/AppToaster";
import { EmblemBackdrop } from "@/components/EmblemBackdrop";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Andrew Polovets | Website",
  description: "Explore my work and projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <EmblemBackdrop>
          <SiteHeader />
          {children}
        </EmblemBackdrop>
        <AppToaster />
      </body>
    </html>
  );
}
