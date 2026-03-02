"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, KeyRound, MoreVertical, Pencil, Trash2, ExternalLink, Share2, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { App } from "@/types";
import { deleteApp, toggleFavorite } from "@/app/actions";
import { getFaviconUrl } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const router = useRouter();

  function handleClick() {
    window.open(app.url, "_blank", "noopener,noreferrer");
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: app.name, url: app.url });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          navigator.clipboard.writeText(app.url);
          toast.success("Link copiado");
        }
      }
    } else {
      navigator.clipboard.writeText(app.url);
      toast.success("Link copiado");
    }
  }

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    await toggleFavorite(app.id, app.is_favorite);
    toast.success(app.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteApp(app.id);
      toast.success(`"${app.name}" removido`);
    } catch {
      toast.error("Erro ao remover app");
      setDeleting(false);
    }
  }

  const accentStyle = app.color
    ? { borderTopColor: app.color }
    : { borderTopColor: "rgb(var(--c-accent))" };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="link"
      tabIndex={0}
      className={`group relative bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-accent/50 hover:bg-elevated transition-all duration-200 border-t-2 ${deleting ? "opacity-50 pointer-events-none" : ""}`}
      style={accentStyle}
    >
      {/* Logo / Favicon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-elevated mb-4 text-2xl">
        {app.logo_url ? (
          <Image
            src={app.logo_url}
            alt={app.name}
            width={40}
            height={40}
            className="rounded-lg object-contain"
          />
        ) : app.icon_emoji ? (
          <span>{app.icon_emoji}</span>
        ) : !faviconError && getFaviconUrl(app.url) ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getFaviconUrl(app.url)!}
            alt=""
            width={32}
            height={32}
            className="rounded object-contain"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <span className="text-lg font-medium text-muted">{app.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <h3 className="font-medium text-sm mb-1 group-hover:text-accent transition-colors">
        {app.name}
      </h3>
      {app.description && (
        <p className="text-xs text-muted line-clamp-2">{app.description}</p>
      )}

      {/* Indicators */}
      <div className="flex items-center gap-2 mt-3 text-muted">
        <button
          onClick={handleToggleFavorite}
          className={`p-1 rounded hover:bg-surface transition-colors ${
            app.is_favorite ? "text-accent" : ""
          }`}
          title={app.is_favorite ? "Remover favorito" : "Favoritar"}
          aria-label={app.is_favorite ? "Remover favorito" : "Favoritar"}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={app.is_favorite ? "currentColor" : "none"}
          />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/apps/${app.id}/credentials`);
          }}
          className={`p-1 rounded hover:bg-surface transition-colors hover:text-accent ${
            app.credentials_enc ? "text-accent" : ""
          }`}
          title={app.credentials_enc ? "Ver credenciais" : "Adicionar credenciais"}
          aria-label={app.credentials_enc ? "Ver credenciais" : "Adicionar credenciais"}
        >
          <KeyRound className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleShare}
          className="p-1 rounded hover:bg-surface transition-colors hover:text-accent"
          title="Compartilhar"
          aria-label="Compartilhar"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded hover:bg-surface transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Menu de opções"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-elevated border border-border rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    navigator.clipboard.writeText(app.url);
                    toast.success("Link copiado");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-surface transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Copiar link
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    router.push(`/apps/${app.id}/edit`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-surface transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setShowConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-surface transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Remover app"
          message={`Tem certeza que deseja remover "${app.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

    </div>
  );
}
