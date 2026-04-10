"use client";

import Image from "next/image";

import { AiGate } from "@/components/ai-gate";

interface CreateTaskButtonProps {
  onManualCreate?: () => void;
  onAICreate?: () => void;
}

export function CreateTaskButton({
  onManualCreate,
  onAICreate,
}: CreateTaskButtonProps) {
  return (
    <div className="group relative inline-block after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-1 after:content-['']">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-[#7255c1] px-[22px] py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#6346b0] [&_svg]:h-[18px] [&_svg]:w-[18px]"
      >
        <Image width={20} height={20} src="/plus.svg" alt="Create Task" />
        Create Task
      </button>
      <div className="absolute right-0 top-[calc(100%+4px)] z-[1001] hidden w-full overflow-hidden rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-hover:block">
        <button
          type="button"
          className="w-full border-b border-input-border bg-transparent px-3 py-2.5 text-left text-sm text-white transition-colors duration-200 first:rounded-t-lg hover:bg-[#3a3a3a]"
          onClick={onManualCreate}
        >
          Compose Manually
        </button>
        <AiGate>
          <button
            type="button"
            className="w-full bg-transparent px-3 py-2.5 text-left text-sm text-white transition-colors duration-200 last:rounded-b-lg hover:bg-[#3a3a3a]"
            onClick={onAICreate}
          >
            Compose with AI
          </button>
        </AiGate>
      </div>
    </div>
  );
}
