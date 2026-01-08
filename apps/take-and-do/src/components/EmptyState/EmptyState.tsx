"use client";

import Image from "next/image";
import {
  EmptyStateContainer,
  EmptyStateImageWrapper,
  EmptyStateTitle,
  EmptyStateText,
} from "./EmptyState.styles";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

function EmptyState({ title = "You have no tasks", message }: EmptyStateProps) {
  return (
    <EmptyStateContainer>
      <EmptyStateImageWrapper>
        <Image
          src="/empty-state.svg"
          alt="No tasks"
          width={96}
          height={96}
        />
      </EmptyStateImageWrapper>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {message && <EmptyStateText>{message}</EmptyStateText>}
    </EmptyStateContainer>
  );
}

export default EmptyState;

