"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, LogOut, Command, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch?.();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-display font-semibold">
            eximIA <span className="text-accent">Workspace</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-muted hover:text-primary hover:border-accent/50 transition-colors"
            >
              <Command className="w-3 h-3" />K
            </button>
          )}

          <Link
            href="/apps/new"
            className="flex items-center gap-2 px-4 py-2 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo App</span>
          </Link>

          <button
            onClick={toggle}
            className="p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-elevated"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-elevated"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
