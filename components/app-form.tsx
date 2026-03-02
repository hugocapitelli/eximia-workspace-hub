"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Upload, Loader2, X, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createApp, updateApp, uploadLogo } from "@/app/actions";
import { CATEGORIES, ACCENT_COLORS } from "@/lib/constants";
import { encrypt } from "@/lib/crypto";
import type { App } from "@/types";
import type { CategoryId } from "@/lib/constants";
import { CredentialFields } from "@/components/credential-fields";
import {
  getCachedMasterPassword,
  cacheMasterPassword,
} from "@/lib/master-password-cache";

interface AppFormProps {
  app?: App;
  userId: string;
}

export function AppForm({ app, userId }: AppFormProps) {
  const router = useRouter();
  const isEditing = !!app;

  const [name, setName] = useState(app?.name ?? "");
  const [url, setUrl] = useState(app?.url ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [category, setCategory] = useState<CategoryId>(app?.category ?? "general");
  const [iconEmoji, setIconEmoji] = useState(app?.icon_emoji ?? "");
  const [color, setColor] = useState(app?.color ?? "");
  const [logoUrl, setLogoUrl] = useState(app?.logo_url ?? "");
  const [credentialsEnc, setCredentialsEnc] = useState(app?.credentials_enc ?? "");
  const [credentialsIv, setCredentialsIv] = useState(app?.credentials_iv ?? "");

  // Raw credential fields (not yet encrypted)
  const [credUsername, setCredUsername] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credNotes, setCredNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Master password prompt state
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);
  const [promptMasterPassword, setPromptMasterPassword] = useState("");

  const hasRawCredentials = !!(credUsername || credPassword || credNotes);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors({ logo: ["Arquivo deve ter no máximo 2MB"] });
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const publicUrl = await uploadLogo(formData);
      setLogoUrl(publicUrl);
      setIconEmoji("");
      toast.success("Logo enviado");
    } catch {
      toast.error("Erro ao fazer upload do logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function doSubmit(masterPwd: string | null) {
    setLoading(true);
    setErrors({});

    let encData = credentialsEnc;
    let ivData = credentialsIv;

    // Encrypt raw credentials if present
    if (hasRawCredentials && masterPwd) {
      try {
        const credentials = JSON.stringify({
          username: credUsername,
          password: credPassword,
          notes: credNotes,
        });
        const result = await encrypt(credentials, masterPwd, userId);
        encData = result.ciphertext;
        ivData = result.iv;
        cacheMasterPassword(masterPwd);
      } catch {
        toast.error("Erro ao criptografar credenciais");
        setLoading(false);
        return;
      }
    }

    const input = {
      name,
      url,
      description,
      category,
      icon_emoji: iconEmoji,
      logo_url: logoUrl,
      color,
      credentials_enc: encData,
      credentials_iv: ivData,
    };

    const result = isEditing
      ? await updateApp(app.id, input)
      : await createApp(input);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
      toast.error("Verifique os campos e tente novamente");
      return;
    }

    toast.success(isEditing ? "App atualizado" : "App criado");
    router.push("/");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (hasRawCredentials) {
      const cached = getCachedMasterPassword();
      if (cached) {
        await doSubmit(cached);
      } else {
        // Need master password — show prompt
        setShowMasterPrompt(true);
      }
    } else {
      await doSubmit(null);
    }
  }

  async function handleMasterPromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!promptMasterPassword) return;
    setShowMasterPrompt(false);
    await doSubmit(promptMasterPassword);
    setPromptMasterPassword("");
  }

  function handleClearCredentials() {
    setCredentialsEnc("");
    setCredentialsIv("");
    setCredUsername("");
    setCredPassword("");
    setCredNotes("");
  }

  return (
    <div className="min-h-screen">
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
        <h1 className="text-xl font-display font-semibold mb-8">
          {isEditing ? "Editar App" : "Novo App"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm text-muted mb-1.5">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
              placeholder="Nome do sistema"
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name[0]}</p>
            )}
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm text-muted mb-1.5">URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
              placeholder="https://..."
            />
            {errors.url && (
              <p className="text-xs text-red-400 mt-1">{errors.url[0]}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
              placeholder="Descrição breve do sistema"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryId)}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-primary focus:outline-none focus:border-accent transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logo / Emoji */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Logo</label>
              <div className="relative">
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={48}
                      height={48}
                      className="rounded-lg object-contain bg-elevated"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="p-1 text-muted hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-border rounded-lg text-muted text-sm cursor-pointer hover:border-accent transition-colors">
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">
                Emoji (alternativa)
              </label>
              <input
                type="text"
                value={iconEmoji}
                onChange={(e) => {
                  setIconEmoji(e.target.value);
                  if (e.target.value) setLogoUrl("");
                }}
                maxLength={4}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-primary text-center text-xl focus:outline-none focus:border-accent transition-colors"
                placeholder="Aa"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Cor de acento
            </label>
            <div className="flex gap-2 items-center">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(color === c ? "" : c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              {color && (
                <button
                  type="button"
                  onClick={() => setColor("")}
                  className="text-xs text-muted hover:text-primary ml-2"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Credentials */}
          <CredentialFields
            hasEncrypted={!!credentialsEnc}
            username={credUsername}
            password={credPassword}
            notes={credNotes}
            onUsernameChange={setCredUsername}
            onPasswordChange={setCredPassword}
            onNotesChange={setCredNotes}
            onClear={handleClearCredentials}
          />

          {/* Form errors */}
          {errors._form && (
            <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
              {errors._form[0]}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/"
              className="px-5 py-2.5 text-sm text-muted border border-border rounded-lg hover:text-primary hover:border-primary/30 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar App"}
            </button>
          </div>
        </form>
      </main>

      {/* Master password prompt overlay */}
      {showMasterPrompt && (
        <div
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMasterPrompt(false);
          }}
        >
          <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium">Senha mestra</h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Defina uma senha mestra para criptografar suas credenciais. Ela
              será lembrada durante esta sessão.
            </p>
            <form onSubmit={handleMasterPromptSubmit} className="space-y-3">
              <input
                type="password"
                value={promptMasterPassword}
                onChange={(e) => setPromptMasterPassword(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                placeholder="Escolha uma senha mestra forte"
              />
              <p className="text-[10px] text-muted/60">
                Se esquecê-la, as credenciais serão irrecuperáveis.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMasterPrompt(false)}
                  className="flex-1 py-2.5 text-sm text-muted border border-border rounded-lg hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!promptMasterPassword}
                  className="flex-1 py-2.5 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
