"use client";

import { useEffect, useState } from "react";

import { ModuleSidebarFrame, useModuleSidebar } from "@components/module-sidebar";
import { ResizeHandle } from "@components/resize-handle";
import {
  clampPanelWidth,
  parseStoredPanelWidth,
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
} from "@/helpers/panel-layout";

const WIDTH_STORAGE_KEY = "todex:overview-sidebar-width";

export function OverviewSidebar() {
  const { open } = useModuleSidebar();
  const [width, setWidth] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH);

  useEffect(() => {
    setWidth(readWidth());
  }, []);

  return (
    <ModuleSidebarFrame open={open} width={width}>
      <ResizeHandle
        label="Resize sidebar"
        edge="trailing"
        width={width}
        min={TASKS_SIDEBAR_MIN_WIDTH}
        max={TASKS_SIDEBAR_MAX_WIDTH}
        onWidth={setWidth}
        onCommit={writeWidth}
      />
      <span className="relative flex h-full shrink-0 flex-col text-center items-center justify-center">
        To be defined
      </span>
    </ModuleSidebarFrame>
  );
}

function readWidth() {
  try {
    return parseStoredPanelWidth(
      localStorage.getItem(WIDTH_STORAGE_KEY),
      TASKS_SIDEBAR_DEFAULT_WIDTH,
      TASKS_SIDEBAR_MIN_WIDTH,
      TASKS_SIDEBAR_MAX_WIDTH,
    );
  } catch {
    return TASKS_SIDEBAR_DEFAULT_WIDTH;
  }
}

function writeWidth(width: number) {
  try {
    localStorage.setItem(
      WIDTH_STORAGE_KEY,
      String(
        clampPanelWidth(
          width,
          TASKS_SIDEBAR_MIN_WIDTH,
          TASKS_SIDEBAR_MAX_WIDTH,
        ),
      ),
    );
  } catch {
    /* private mode / quota */
  }
}
