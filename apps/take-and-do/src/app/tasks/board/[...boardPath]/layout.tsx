import type { Metadata } from "next";
import type { ReactNode } from "react";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

export async function generateMetadata({
  params,
}: BoardRouteLayoutProps): Promise<Metadata> {
  const { boardPath } = await params;
  const parsedBoardPath = tasksUrlHelper.routing.parseBoardPath(boardPath);

  return {
    title: parsedBoardPath?.boardName ?? "Board",
  };
}

export default function BoardRouteLayout({ children }: BoardRouteLayoutProps) {
  return children;
}

interface BoardRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ boardPath: string[] }>;
}
