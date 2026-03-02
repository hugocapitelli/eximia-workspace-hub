"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { encrypt } from "@/lib/crypto";

interface CredentialFieldsProps {
  encryptedData: string;
  iv: string;
  userId: string;
  onEncrypted: (enc: string, iv: string) => void;
}

export function CredentialFields({
  encryptedData,
  iv,
  userId,
  onEncrypted,
}: CredentialFieldsProps) {
  const [open, setOpen] = useState(!!encryptedData);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [encrypted, setEncrypted] = useState(!!encryptedData);

  async function handleEncrypt() {
    if (!masterPassword) return;
    if (!username && !password && !notes) return;

    const credentials = JSON.stringify({ username, password, notes });
    const result = await encrypt(credentials, masterPassword, userId);
    onEncrypted(result.ciphertext, result.iv);
    setEncrypted(true);
    setUsername("");
    setPassword("");
    setNotes("");
    setMasterPassword("");
  }

  async function handleClear() {
    onEncrypted("", "");
    setEncrypted(false);
    setUsername("");
    setPassword("");
    setNotes("");
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Credenciais {encrypted && "(criptografadas)"}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {encrypted ? (
            <div className="text-center py-4">
              <Lock className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-sm text-muted mb-3">
                Credenciais criptografadas salvas
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
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
                  onChange={(e) => setUsername(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Tokens, chaves de API..."
                />
              </div>

              <div className="pt-2 border-t border-border">
                <label
                  htmlFor="cred-master"
                  className="block text-xs text-muted mb-1"
                >
                  Senha mestra (para criptografar)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cred-master"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Sua senha mestra"
                  />
                  <button
                    type="button"
                    onClick={handleEncrypt}
                    disabled={!masterPassword || (!username && !password && !notes)}
                    className="px-4 py-2 bg-accent/20 text-accent text-xs font-medium rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-30"
                  >
                    Criptografar
                  </button>
                </div>
                <p className="text-[10px] text-muted/60 mt-1.5">
                  A senha mestra nunca é armazenada. Se esquecê-la, as
                  credenciais serão irrecuperáveis.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
