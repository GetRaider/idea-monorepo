"use client";

import Image from "next/image";

import { ChevronDownIcon } from "@/components/Icons";

import {
  DropdownItem,
  DropdownMenu,
  Trigger,
  Wrapper,
} from "./CreateTaskButton.styles";

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
        <DropdownItem onClick={onAICreate}>Compose with AI</DropdownItem>
        <DropdownItem onClick={onManualCreate}>Manually</DropdownItem>
      </DropdownMenu>
    </Wrapper>
  );
}
