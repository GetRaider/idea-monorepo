"use client";

import Image from "next/image";

import { ChevronDownIcon } from "@/components/Icons";

import {
  AIDropdownItem,
  DropdownItem,
  DropdownMenu,
  Trigger,
  Wrapper,
} from "./CreateTaskButton.styles";
import { Separator } from "@radix-ui/themes";

interface CreateTaskButtonProps {
  onManualCreate?: () => void;
  onAICreate?: () => void;
}

export function CreateTaskButton({
  onManualCreate,
  onAICreate,
}: CreateTaskButtonProps) {
  return (
    <Wrapper>
      <Trigger>
        <Image width={20} height={20} src="/plus.svg" alt="Create Task" />
        Create Task
      </Trigger>
      <DropdownMenu>
        <DropdownItem onClick={onManualCreate}>Compose Manually</DropdownItem>
        <DropdownItem onClick={onAICreate}>Compose with AI</DropdownItem>
      </DropdownMenu>
    </Wrapper>
  );
}
