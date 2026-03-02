"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, Star } from "lucide-react";
import type { App } from "@/types";
import { getFaviconUrl } from "@/lib/utils";

interface QuickLaunchProps {
  apps: App[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuickLaunch({ apps, isOpen, onClose }: QuickLaunchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        window.open(filtered[selectedIndex].url, "_blank", "noopener,noreferrer");
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar e abrir sistema..."
            className="flex-1 bg-transparent text-primary placeholder:text-muted/50 focus:outline-none text-sm"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted bg-elevated px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Nenhum sistema encontrado
            </div>
          ) : (
            filtered.map((app, i) => (
              <button
                key={app.id}
                onClick={() => {
                  window.open(app.url, "_blank", "noopener,noreferrer");
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex
                    ? "bg-elevated text-primary"
                    : "text-muted hover:bg-elevated/50 hover:text-primary"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                  {app.icon_emoji ? (
                    app.icon_emoji
                  ) : getFaviconUrl(app.url) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getFaviconUrl(app.url)!}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded object-contain"
                    />
                  ) : (
                    <span className="font-medium text-muted">{app.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{app.name}</p>
                  {app.description && (
                    <p className="text-xs text-muted truncate">{app.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {app.is_favorite && <Star className="w-3 h-3 text-accent" fill="currentColor" />}
                  <ExternalLink className="w-3 h-3 text-muted" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
