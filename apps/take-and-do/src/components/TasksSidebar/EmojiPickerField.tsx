"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  EmojiButton,
  EmojiClearButton,
  EmojiPickerHolder,
  EmojiPickerPopover,
  EmojiPreview,
} from "./TasksSidebar.ui";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((m) => m.default),
  { ssr: false },
);

export function EmojiPickerField({
  emoji,
  isOpen,
  fallbackIconAlt,
  fallbackIconSrc,
  onToggle,
  onSelect,
  onClear,
}: EmojiPickerFieldProps) {
  return (
    <EmojiPickerHolder>
      <EmojiButton
        type="button"
        $hasEmoji={emoji !== null}
        data-emoji-trigger
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={`Set ${fallbackIconAlt.toLowerCase()} emoji`}
      >
        {emoji ? (
          <EmojiPreview>{emoji}</EmojiPreview>
        ) : (
          <Image
            width={20}
            height={20}
            src={fallbackIconSrc}
            alt={fallbackIconAlt}
          />
        )}
      </EmojiButton>

      {isOpen ? (
        <EmojiPickerPopover
          data-emoji-picker-popover
          onClick={(e) => e.stopPropagation()}
        >
          <EmojiPicker
            theme={"dark" as import("emoji-picker-react").Theme}
            width={320}
            height={360}
            autoFocusSearch={false}
            onEmojiClick={(emojiData) => {
              onSelect((emojiData as { emoji: string }).emoji);
            }}
          />
          {emoji !== null ? (
            <EmojiClearButton
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              Clear emoji
            </EmojiClearButton>
          ) : null}
        </EmojiPickerPopover>
      ) : null}
    </EmojiPickerHolder>
  );
}

interface EmojiPickerFieldProps {
  emoji: string | null;
  isOpen: boolean;
  fallbackIconSrc: string;
  fallbackIconAlt: string;
  onToggle: () => void;
  onSelect: (emoji: string) => void;
  onClear: () => void;
}
