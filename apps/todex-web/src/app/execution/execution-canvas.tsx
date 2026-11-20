"use client";

import type { ReactNode } from "react";

import { useOpenCreateMenu } from "@components/create-menu";
import { NewButton } from "@components/new-button";

export function ExecutionCanvas({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const openCreateMenu = useOpenCreateMenu();

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-3">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions ?? <NewButton onClick={openCreateMenu} />}
      </div>
      {children}
    </section>
  );
}
