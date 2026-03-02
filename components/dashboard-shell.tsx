"use client";

import { useState } from "react";
import type { App } from "@/types";
import { Header } from "@/components/header";
import { AppGrid } from "@/components/app-grid";
import { QuickLaunch } from "@/components/quick-launch";

interface DashboardShellProps {
  apps: App[];
}

export function DashboardShell({ apps }: DashboardShellProps) {
  const [quickLaunchOpen, setQuickLaunchOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header onOpenSearch={() => setQuickLaunchOpen(true)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AppGrid apps={apps} />
      </main>
      <QuickLaunch
        apps={apps}
        isOpen={quickLaunchOpen}
        onClose={() => setQuickLaunchOpen(false)}
      />
    </div>
  );
}
