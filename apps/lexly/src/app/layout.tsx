import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";

import { AppToaster } from "@/components/AppToaster";
import { AppNav } from "@/components/layout/AppNav";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lexly",
    template: "Lexly | %s",
  },
  description: "Turn YouTube vocabulary into personal practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} min-h-screen`}>
        <QueryProvider>
          <AppNav />
          <main className="mx-auto max-w-5xl px-4 py-6">
            {children}
          </main>
          <AppToaster />
        </QueryProvider>
      </body>
    </html>
  );
}

