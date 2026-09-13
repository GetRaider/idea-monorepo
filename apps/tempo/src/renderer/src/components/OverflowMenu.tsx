import { cn } from "../lib/cn";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function OverflowMenu({
  disabled = false,
  items,
  triggerClassName,
  contentClassName,
}: OverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled}
        aria-label="More actions"
        className={cn(
          "cursor-pointer border-0 bg-transparent px-1 text-tempo-muted hover:text-tempo-text disabled:cursor-not-allowed disabled:opacity-40",
          triggerClassName,
        )}
      >
        ⋯
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            disabled={item.disabled === true}
            danger={item.danger === true}
            onSelect={item.onSelect}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface OverflowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
}
