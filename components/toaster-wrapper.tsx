"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function ToasterWrapper() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--primary)",
        },
      }}
    />
  );
}
