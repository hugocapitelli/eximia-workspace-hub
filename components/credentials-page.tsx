"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Fingerprint,
  Pencil,
  Trash2,
  Plus,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { App, Credentials } from "@/types";
import { decrypt, encrypt } from "@/lib/crypto";
import { CREDENTIAL_REVEAL_DURATION } from "@/lib/constants";
import { getFaviconUrl } from "@/lib/utils";
import { updateAppCredentials } from "@/app/actions";
import {
  isBiometricAvailable,
  registerBiometric,
  authenticateBiometric,
} from "@/lib/webauthn";
import {
  hasEnrollment,
  getEnrollment,
  getMasterPassword,
  saveEnrollment,
  deleteEnrollment,
} from "@/lib/biometric-store";
import {
  getCachedMasterPassword,
  cacheMasterPassword,
} from "@/lib/master-password-cache";

type PageState = "locked" | "unlocked" | "editing" | "adding";

interface CredentialsPageProps {
  app: App;
  userId: string;
}

export function CredentialsPage({ app, userId }: CredentialsPageProps) {
  const hasCredentials = !!app.credentials_enc;

  // Track credentials data locally (server data may be stale after save)
  const [credEnc, setCredEnc] = useState(app.credentials_enc);
  const [credIv, setCredIv] = useState(app.credentials_iv);

  const [state, setState] = useState<PageState>(
    hasCredentials ? "locked" : "adding"
  );
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(CREDENTIAL_REVEAL_DURATION / 1000);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [showEnrollBanner, setShowEnrollBanner] = useState(false);

  // Form state (for adding/editing)
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formMaster, setFormMaster] = useState("");
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Favicon error
  const [faviconError, setFaviconError] = useState(false);

  // Ref for stable handleLock in timer
  const stateRef = useRef(state);
  stateRef.current = state;

  // Check biometric availability
  useEffect(() => {
    async function check() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available && credEnc) {
        const enrolled = await hasEnrollment(app.id);
        setBiometricEnrolled(enrolled);
      }
    }
    check();
  }, [app.id, credEnc]);

  // Auto-decrypt on mount if master password is cached
  useEffect(() => {
    if (!credEnc || !credIv) return;
    const cached = getCachedMasterPassword();
    if (!cached) return;

    let cancelled = false;
    setLoading(true);

    decrypt(credEnc, credIv, cached, userId)
      .then((plaintext) => {
        if (cancelled) return;
        const parsed = JSON.parse(plaintext) as Credentials;
        setCredentials(parsed);
        setMasterPassword(cached);
        setState("unlocked");
      })
      .catch(() => {
        // Cached password no longer valid — ignore silently
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide timer when unlocked
  useEffect(() => {
    if (state !== "unlocked") return;
    setTimeLeft(CREDENTIAL_REVEAL_DURATION / 1000);

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // Lock
          setCredentials(null);
          setShowPassword(false);
          setCopied(null);
          setShowDeleteConfirm(false);
          setState("locked");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  function handleLock() {
    setCredentials(null);
    setMasterPassword("");
    setShowPassword(false);
    setCopied(null);
    setShowDeleteConfirm(false);
    setState("locked");
  }

  // Decrypt with master password
  async function handleDecryptWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!credEnc || !credIv) return;

    setLoading(true);
    setError(null);

    try {
      const plaintext = await decrypt(credEnc, credIv, masterPassword, userId);
      const parsed = JSON.parse(plaintext) as Credentials;
      setCredentials(parsed);
      cacheMasterPassword(masterPassword);

      if (biometricAvailable && !biometricEnrolled) {
        setShowEnrollBanner(true);
      }

      setState("unlocked");
    } catch {
      setError("Senha mestra incorreta");
    } finally {
      setLoading(false);
    }
  }

  // Decrypt with Touch ID
  async function handleDecryptWithBiometric() {
    if (!credEnc || !credIv) return;

    setLoading(true);
    setError(null);

    try {
      const enrollment = await getEnrollment(app.id);
      if (!enrollment) {
        setError("Touch ID não configurado para este app");
        setLoading(false);
        return;
      }

      const authenticated = await authenticateBiometric(
        enrollment.credentialId
      );
      if (!authenticated) {
        setError("Autenticação biométrica falhou");
        setLoading(false);
        return;
      }

      const storedMaster = await getMasterPassword(app.id);
      if (!storedMaster) {
        setError("Não foi possível recuperar a senha mestra");
        setBiometricEnrolled(false);
        await deleteEnrollment(app.id);
        setLoading(false);
        return;
      }

      const plaintext = await decrypt(credEnc, credIv, storedMaster, userId);
      const parsed = JSON.parse(plaintext) as Credentials;
      setCredentials(parsed);
      setMasterPassword(storedMaster);
      cacheMasterPassword(storedMaster);
      setState("unlocked");
    } catch {
      setError("Falha na descriptografia. A senha mestra pode ter mudado.");
      setBiometricEnrolled(false);
      await deleteEnrollment(app.id);
    } finally {
      setLoading(false);
    }
  }

  // Enroll biometric
  async function handleEnrollBiometric() {
    if (!masterPassword) {
      toast.error("Desbloqueie com a senha mestra primeiro");
      return;
    }

    setLoading(true);
    try {
      const result = await registerBiometric(userId);
      if (!result) {
        toast.error("Não foi possível configurar o Touch ID");
        return;
      }

      await saveEnrollment(app.id, result.credentialId, masterPassword);
      setBiometricEnrolled(true);
      setShowEnrollBanner(false);
      toast.success("Touch ID configurado");
    } catch {
      toast.error("Erro ao configurar Touch ID");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  function handleStartEditing() {
    if (!credentials) return;
    setFormUsername(credentials.username);
    setFormPassword(credentials.password);
    setFormNotes(credentials.notes);
    setFormMaster("");
    setState("editing");
  }

  // Save credentials (add or edit)
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const effectiveMaster = formMaster || getCachedMasterPassword() || "";
    if (!effectiveMaster) return;
    if (!formUsername && !formPassword && !formNotes) {
      toast.error("Preencha pelo menos um campo");
      return;
    }

    setSaving(true);
    try {
      const credentialData = JSON.stringify({
        username: formUsername,
        password: formPassword,
        notes: formNotes,
      });

      const result = await encrypt(credentialData, effectiveMaster, userId);

      const updateResult = await updateAppCredentials(
        app.id,
        result.ciphertext,
        result.iv
      );
      if (updateResult.error) {
        toast.error(
          updateResult.error._form?.[0] ?? "Erro ao salvar"
        );
        return;
      }

      setCredEnc(result.ciphertext);
      setCredIv(result.iv);

      cacheMasterPassword(effectiveMaster);

      if (state === "adding" && biometricAvailable) {
        setMasterPassword(effectiveMaster);
        setShowEnrollBanner(true);
      }

      if (state === "editing" && biometricEnrolled) {
        const enrollment = await getEnrollment(app.id);
        if (enrollment) {
          await saveEnrollment(app.id, enrollment.credentialId, effectiveMaster);
        }
      }

      setCredentials({
        username: formUsername,
        password: formPassword,
        notes: formNotes,
      });
      setMasterPassword(effectiveMaster);
      setFormMaster("");
      setState("unlocked");
      toast.success(
        state === "adding" ? "Credenciais salvas" : "Credenciais atualizadas"
      );
    } catch {
      toast.error("Erro ao criptografar credenciais");
    } finally {
      setSaving(false);
    }
  }

  // Delete credentials
  async function handleDeleteCredentials() {
    setSaving(true);
    try {
      const updateResult = await updateAppCredentials(app.id, "", "");
      if (updateResult.error) {
        toast.error(
          updateResult.error._form?.[0] ?? "Erro ao remover"
        );
        return;
      }

      setCredEnc(null);
      setCredIv(null);

      if (biometricEnrolled) {
        await deleteEnrollment(app.id);
        setBiometricEnrolled(false);
      }

      setCredentials(null);
      setShowDeleteConfirm(false);
      setMasterPassword("");
      setState("adding");
      toast.success("Credenciais removidas");
    } catch {
      toast.error("Erro ao remover credenciais");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* App Info Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-elevated text-xl"
            style={
              app.color
                ? { borderColor: app.color, borderWidth: 2 }
                : undefined
            }
          >
            {app.logo_url ? (
              <Image
                src={app.logo_url}
                alt={app.name}
                width={32}
                height={32}
                className="rounded-lg object-contain"
              />
            ) : app.icon_emoji ? (
              <span>{app.icon_emoji}</span>
            ) : !faviconError && getFaviconUrl(app.url) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getFaviconUrl(app.url)!}
                alt=""
                width={24}
                height={24}
                className="rounded object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <span className="text-base font-medium text-muted">
                {app.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-display font-semibold">{app.name}</h1>
            <p className="text-xs text-muted">Gerenciar credenciais</p>
          </div>
        </div>

        {/* State: LOCKED */}
        {state === "locked" && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <Lock className="w-10 h-10 text-accent mx-auto mb-4" />
            <h2 className="text-sm font-medium mb-1">
              Credenciais protegidas
            </h2>
            <p className="text-xs text-muted mb-6">
              Autentique-se para visualizar as credenciais deste app
            </p>

            {/* Touch ID button */}
            {biometricEnrolled && (
              <button
                onClick={handleDecryptWithBiometric}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 mb-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Fingerprint className="w-5 h-5" />
                )}
                Desbloquear com Touch ID
              </button>
            )}

            {/* Divider */}
            {biometricEnrolled && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface px-3 text-[10px] text-muted uppercase tracking-wider">
                    ou
                  </span>
                </div>
              </div>
            )}

            {/* Master password form */}
            <form
              onSubmit={handleDecryptWithPassword}
              className="text-left space-y-3"
            >
              <div>
                <label
                  htmlFor="master-pwd"
                  className="block text-xs text-muted mb-1"
                >
                  Senha mestra
                </label>
                <input
                  id="master-pwd"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => {
                    setMasterPassword(e.target.value);
                    setError(null);
                  }}
                  autoFocus={!biometricEnrolled}
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
                className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  biometricEnrolled
                    ? "bg-elevated text-primary border border-border hover:border-accent"
                    : "bg-accent text-bg hover:bg-accent/90"
                }`}
              >
                {loading ? "Descriptografando..." : "Usar senha mestra"}
              </button>
            </form>
          </div>
        )}

        {/* State: UNLOCKED */}
        {state === "unlocked" && credentials && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Credenciais</span>
                </div>
                <button
                  onClick={handleLock}
                  className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  Bloquear
                </button>
              </div>

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
                Auto-lock em {timeLeft}s
              </p>

              {/* Username */}
              {credentials.username && (
                <div className="bg-bg rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-muted uppercase tracking-wider">
                      Usuário
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(credentials.username, "user")
                      }
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
                    >
                      {copied === "user" ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all select-all">
                    {credentials.username}
                  </p>
                </div>
              )}

              {/* Password */}
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
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Mostrar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleCopy(credentials.password, "pass")
                        }
                        className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
                      >
                        {copied === "pass" ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />{" "}
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-mono break-all select-all">
                    {showPassword ? credentials.password : "••••••••••••"}
                  </p>
                </div>
              )}

              {/* Notes */}
              {credentials.notes && (
                <div className="bg-bg rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-muted uppercase tracking-wider">
                      Notas
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(credentials.notes, "notes")
                      }
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
                    >
                      {copied === "notes" ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-primary/80 whitespace-pre-wrap select-all">
                    {credentials.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleStartEditing}
                  className="flex items-center gap-2 px-4 py-2 text-xs bg-elevated border border-border rounded-lg hover:border-accent text-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-red-400 bg-elevated border border-border rounded-lg hover:border-red-400/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>

            {/* Biometric enrollment banner */}
            {showEnrollBanner &&
              biometricAvailable &&
              !biometricEnrolled && (
                <div className="bg-surface border border-accent/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      Configurar Touch ID?
                    </p>
                    <p className="text-xs text-muted mb-3">
                      Use sua impressão digital para desbloquear credenciais
                      instantaneamente
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEnrollBiometric}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        Configurar
                      </button>
                      <button
                        onClick={() => setShowEnrollBanner(false)}
                        className="px-3 py-1.5 text-xs text-muted hover:text-primary transition-colors"
                      >
                        Agora não
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4">
                <p className="text-sm text-red-400 font-medium mb-1">
                  Excluir credenciais?
                </p>
                <p className="text-xs text-muted mb-3">
                  Esta ação é irreversível. As credenciais criptografadas serão
                  permanentemente removidas.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteCredentials}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    Excluir
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs text-muted hover:text-primary transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State: EDITING */}
        {state === "editing" && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Pencil className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-medium">Editar credenciais</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="edit-user"
                  className="block text-xs text-muted mb-1"
                >
                  Usuário / Email
                </label>
                <input
                  id="edit-user"
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-pass"
                  className="block text-xs text-muted mb-1"
                >
                  Senha
                </label>
                <input
                  id="edit-pass"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-notes"
                  className="block text-xs text-muted mb-1"
                >
                  Notas
                </label>
                <textarea
                  id="edit-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Tokens, chaves de API..."
                />
              </div>

              {!getCachedMasterPassword() && (
                <div className="pt-3 border-t border-border">
                  <label
                    htmlFor="edit-master"
                    className="block text-xs text-muted mb-1"
                  >
                    Senha mestra (para re-criptografar)
                  </label>
                  <input
                    id="edit-master"
                    type="password"
                    value={formMaster}
                    onChange={(e) => setFormMaster(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Sua senha mestra"
                  />
                  <p className="text-[10px] text-muted/60 mt-1">
                    A senha mestra nunca é armazenada. Se esquecê-la, as
                    credenciais serão irrecuperáveis.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setState("unlocked")}
                  className="px-4 py-2.5 text-sm text-muted border border-border rounded-lg hover:text-primary hover:border-primary/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    (!formMaster && !getCachedMasterPassword()) ||
                    (!formUsername && !formPassword && !formNotes)
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* State: ADDING */}
        {state === "adding" && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-medium">Adicionar credenciais</h2>
            </div>
            <p className="text-xs text-muted mb-6">
              Armazene as credenciais de acesso de forma segura com criptografia
              AES-256
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="add-user"
                  className="block text-xs text-muted mb-1"
                >
                  Usuário / Email
                </label>
                <input
                  id="add-user"
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="add-pass"
                  className="block text-xs text-muted mb-1"
                >
                  Senha
                </label>
                <input
                  id="add-pass"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="add-notes"
                  className="block text-xs text-muted mb-1"
                >
                  Notas
                </label>
                <textarea
                  id="add-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Tokens, chaves de API..."
                />
              </div>

              {!getCachedMasterPassword() && (
                <div className="pt-3 border-t border-border">
                  <label
                    htmlFor="add-master"
                    className="block text-xs text-muted mb-1"
                  >
                    Senha mestra (para criptografar)
                  </label>
                  <input
                    id="add-master"
                    type="password"
                    value={formMaster}
                    onChange={(e) => setFormMaster(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Escolha uma senha mestra forte"
                  />
                  <p className="text-[10px] text-muted/60 mt-1">
                    A senha mestra nunca é armazenada. Se esquecê-la, as
                    credenciais serão irrecuperáveis.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Link
                  href="/"
                  className="px-4 py-2.5 text-sm text-muted border border-border rounded-lg hover:text-primary hover:border-primary/30 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    (!formMaster && !getCachedMasterPassword()) ||
                    (!formUsername && !formPassword && !formNotes)
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criptografar e salvar
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
