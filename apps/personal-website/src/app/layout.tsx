import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { profile } from "@/data/profile";
import { SITE_URL } from "@/lib/format";

import "./globals.css";

const inter = localFont({
  src: "./inter-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
});

const description = `${profile.title}. ${profile.oneLiner}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${profile.name}, Product Engineer`, template: `%s · ${profile.name}` },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: profile.name,
    title: `${profile.name}, Product Engineer`,
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b1119",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.title,
  description: profile.oneLiner,
  url: SITE_URL,
  sameAs: [profile.contact.linkedin, profile.contact.github],
  knowsAbout: [...profile.about.stack, ...profile.about.ai],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Marks the page as scripted so scroll reveals may start hidden; without JS everything shows. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-ember px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
