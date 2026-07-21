"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      theme="light"
      position="bottom-right"
      closeButton
      toastOptions={{ duration: 5000 }}
    />
  );
}

