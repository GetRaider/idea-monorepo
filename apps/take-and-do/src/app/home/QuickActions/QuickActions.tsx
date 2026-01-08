"use client";

import { Container, ActionButton } from "./QuickActions.styles";

function QuickActions() {
  return (
    <Container>
      <ActionButton href="/tasks">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" fill="currentColor" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            fill="currentColor"
          />
        </svg>
        Go to Tasks
      </ActionButton>
      <ActionButton href="/tasks" $disabled>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            fill="currentColor"
          />
        </svg>
        Calendar (Coming Soon)
      </ActionButton>
    </Container>
  );
}

export default QuickActions;

