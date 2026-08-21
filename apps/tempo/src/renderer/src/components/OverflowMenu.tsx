import { useEffect, useRef, useState } from "react";

import {
  MenuItem,
  MenuPanel,
  MenuRoot,
  MenuTrigger,
} from "./OverflowMenu.styles";

export function OverflowMenu({ disabled = false, items }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] =
    useState<OverflowMenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function close() {
      setIsOpen(false);
      setPanelPosition(null);
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current === null || event.target === null) {
        return;
      }
      if (
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        close();
      }
    }

    function handleReposition() {
      const trigger = triggerRef.current;
      if (trigger === null) {
        return;
      }
      const bounds = trigger.getBoundingClientRect();
      setPanelPosition({
        top: bounds.bottom + 4,
        right: window.innerWidth - bounds.right,
      });
    }

    handleReposition();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [isOpen]);

  return (
    <MenuRoot ref={rootRef}>
      <MenuTrigger
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            setPanelPosition(null);
            return;
          }
          const trigger = triggerRef.current;
          if (trigger !== null) {
            const bounds = trigger.getBoundingClientRect();
            setPanelPosition({
              top: bounds.bottom + 4,
              right: window.innerWidth - bounds.right,
            });
          }
          setIsOpen(true);
        }}
      >
        ⋯
      </MenuTrigger>
      {isOpen && panelPosition !== null ? (
        <MenuPanel
          role="menu"
          $top={panelPosition.top}
          $right={panelPosition.right}
        >
          {items.map((item) => (
            <MenuItem
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled === true}
              $danger={item.danger === true}
              onClick={() => {
                setIsOpen(false);
                setPanelPosition(null);
                item.onSelect();
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuPanel>
      ) : null}
    </MenuRoot>
  );
}

interface OverflowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface OverflowMenuPosition {
  top: number;
  right: number;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  disabled?: boolean;
}
