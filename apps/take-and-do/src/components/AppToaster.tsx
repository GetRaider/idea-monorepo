"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "sonner";

/**
 * Renders Sonner on `document.body` (outside Radix Theme) so toasts stack above
 * modal overlays (`z-[4000]`) and are not affected by Theme stacking contexts.
 */
export function AppToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <Toaster
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{ duration: 5000 }}
      style={{ zIndex: 100000 }}
    />,
    document.body,
  );
}
