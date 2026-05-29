import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Access Restricted",
};

export default function AuthErrorLayout({ children }: { children: ReactNode }) {
  return children;
}
