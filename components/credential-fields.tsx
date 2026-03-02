"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Trash2 } from "lucide-react";

interface CredentialFieldsProps {
  hasEncrypted: boolean;
  username: string;
  password: string;
  notes: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onClear: () => void;
}

export function CredentialFields({
  hasEncrypted,
  username,
  password,
  notes,
  onUsernameChange,
  onPasswordChange,
  onNotesChange,
  onClear,
}: CredentialFieldsProps) {
  const [open, setOpen] = useState(hasEncrypted || !!(username || password || notes));

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Credenciais{" "}
          {hasEncrypted && !username && !password && !notes
            ? "(criptografadas)"
            : username || password || notes
              ? "(preenchidas)"
              : ""}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {hasEncrypted && !username && !password && !notes ? (
            <div className="text-center py-4">
              <Lock className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-sm text-muted mb-3">
                Credenciais criptografadas salvas
              </p>
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1.5 mx-auto text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remover credenciais
              </button>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="cred-username"
                  className="block text-xs text-muted mb-1"
                >
                  Usuário / Email
                </label>
                <input
                  id="cred-username"
                  type="text"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="usuario@email.com"
                />
              </div>
              <div>
                <label
                  htmlFor="cred-password"
                  className="block text-xs text-muted mb-1"
                >
                  Senha
                </label>
                <input
                  id="cred-password"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label
                  htmlFor="cred-notes"
                  className="block text-xs text-muted mb-1"
                >
                  Notas
                </label>
                <textarea
                  id="cred-notes"
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Tokens, chaves de API..."
                />
              </div>
              <p className="text-[10px] text-muted/60">
                As credenciais serão criptografadas automaticamente ao salvar.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
