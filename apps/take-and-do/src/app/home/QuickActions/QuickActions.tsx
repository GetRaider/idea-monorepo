"use client";

import { ClipboardCheckIcon, CalendarMonthIcon } from "@/components/Icons";
import { Container, ActionButton } from "./QuickActions.styles";

function QuickActions() {
  return (
    <Container>
      <ActionButton href="/tasks">
        <ClipboardCheckIcon size={20} />
        Go to Tasks
      </ActionButton>
      <ActionButton href="/tasks" $disabled>
        <CalendarMonthIcon size={20} />
        Calendar (Coming Soon)
      </ActionButton>
    </Container>
  );
}

export default QuickActions;
