import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "../../lib/cn";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function SelectMenu({
  value,
  options,
  disabled = false,
  className,
  ariaLabel,
  onValueChange,
}: SelectMenuProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-left text-sm text-tempo-text disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <span className="ml-2 shrink-0 text-tempo-faint" aria-hidden>
          ▾
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value === "" ? "empty" : option.value}
            onSelect={() => onValueChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuContent({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={4}
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-xl border border-solid border-tempo-line-2 bg-[#101114] p-1 text-sm text-tempo-text shadow-lg",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  danger = false,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "cursor-pointer rounded-lg px-3 py-2 outline-none focus:bg-tempo-panel",
        danger ? "text-tempo-danger" : "text-tempo-text",
        className,
      )}
      {...props}
    />
  );
}

interface DropdownMenuItemProps
  extends DropdownMenuPrimitive.DropdownMenuItemProps {
  danger?: boolean;
}

interface SelectMenuOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  options: SelectMenuOption[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  onValueChange: (value: string) => void;
}
