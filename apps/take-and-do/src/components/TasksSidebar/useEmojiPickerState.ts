"use client";

import { useCallback, useEffect, useState } from "react";

export function useEmojiPickerState() {
  const [editingBoardEmoji, setEditingBoardEmoji] = useState<string | null>(
    null,
  );
  const [openBoardEmojiPickerId, setOpenBoardEmojiPickerId] = useState<
    string | null
  >(null);
  const [editingFolderEmoji, setEditingFolderEmoji] = useState<string | null>(
    null,
  );
  const [openFolderEmojiPickerId, setOpenFolderEmojiPickerId] = useState<
    string | null
  >(null);

  const closeAllEmojiPickers = useCallback(() => {
    setOpenBoardEmojiPickerId(null);
    setOpenFolderEmojiPickerId(null);
  }, []);

  useEffect(() => {
    if (!openBoardEmojiPickerId && !openFolderEmojiPickerId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllEmojiPickers();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAllEmojiPickers, openBoardEmojiPickerId, openFolderEmojiPickerId]);

  useEffect(() => {
    if (!openBoardEmojiPickerId && !openFolderEmojiPickerId) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-emoji-picker-popover]") ||
        target.closest("[data-emoji-trigger]")
      )
        return;
      closeAllEmojiPickers();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [closeAllEmojiPickers, openBoardEmojiPickerId, openFolderEmojiPickerId]);

  return {
    editingBoardEmoji,
    setEditingBoardEmoji,
    openBoardEmojiPickerId,
    setOpenBoardEmojiPickerId,
    editingFolderEmoji,
    setEditingFolderEmoji,
    openFolderEmojiPickerId,
    setOpenFolderEmojiPickerId,
    closeAllEmojiPickers,
  };
}
