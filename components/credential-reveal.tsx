"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, Eye, EyeOff, Copy, Check, X } from "lucide-react";
import { decrypt } from "@/lib/crypto";
import { CREDENTIAL_REVEAL_DURATION } from "@/lib/constants";
import type { Credentials } from "@/types";

interface CredentialRevealProps {
  encryptedData: string;
  iv: string;
  userId: string;
  onClose: () => void;
}

export function CredentialReveal({
  encryptedData,
  iv,
  userId,
  onClose,
}: CredentialRevealProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(CREDENTIAL_REVEAL_DURATION / 1000);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Clear credentials and close
  const handleClose = useCallback(() => {
    setCredentials(null);
    setMasterPassword("");
    setShowPassword(false);
    setCopied(null);
    onCloseRef.current();
  }, []);

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [credentials]);

  // Auto-hide timer
  useEffect(() => {
    if (!credentials) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [credentials, handleClose]);

  async function handleDecrypt(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const plaintext = await decrypt(encryptedData, iv, masterPassword, userId);
      const parsed = JSON.parse(plaintext) as Credentials;
      setCredentials(parsed);
      setMasterPassword("");
    } catch {
      setError("Senha mestra incorreta");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Credenciais"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm bg-surface border border-border rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            Credenciais
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-muted hover:text-primary transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!credentials ? (
          <form onSubmit={handleDecrypt} className="space-y-3">
            <div>
              <label htmlFor="reveal-master" className="block text-xs text-muted mb-1">
                Senha mestra
              </label>
              <input
                id="reveal-master"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                placeholder="Digite sua senha mestra"
              />
            </div>
            {error && (
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !masterPassword}
              className="w-full py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Descriptografando..." : "Revelar"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Timer bar */}
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-1000 ease-linear"
                style={{
                  width: `${(timeLeft / (CREDENTIAL_REVEAL_DURATION / 1000)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted text-center">
              Auto-hide em {timeLeft}s
            </p>

            {credentials.username && (
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted uppercase tracking-wider">
                    Usuario
                  </p>
                  <button
                    onClick={() => handleCopy(credentials.username, "user")}
                    className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
                    aria-label="Copiar usuario"
                  >
                    {copied === "user" ? (
                      <><Check className="w-3 h-3 text-accent-alt" /> Copiado</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copiar</>
                    )}
                  </button>
                </div>
                <p className="text-sm font-mono break-all select-all">
                  {credentials.username}
                </p>
              </div>
            )}

            {credentials.password && (
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted uppercase tracking-wider">
                    Senha
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <><EyeOff className="w-3 h-3" /> Ocultar</>
                      ) : (
                        <><Eye className="w-3 h-3" /> Mostrar</>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(credentials.password, "pass")}
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
                      aria-label="Copiar senha"
                    >
                      {copied === "pass" ? (
                        <><Check className="w-3 h-3 text-accent-alt" /> Copiado</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copiar</>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-mono break-all select-all">
                  {showPassword
                    ? credentials.password
                    : "••••••••••••"}
                </p>
              </div>
            )}

            {credentials.notes && (
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted uppercase tracking-wider">
                    Notas
                  </p>
                  <button
                    onClick={() => handleCopy(credentials.notes, "notes")}
                    className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
                    aria-label="Copiar notas"
                  >
                    {copied === "notes" ? (
                      <><Check className="w-3 h-3 text-accent-alt" /> Copiado</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copiar</>
                    )}
                  </button>
                </div>
                <p className="text-xs text-primary/80 whitespace-pre-wrap select-all">
                  {credentials.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
