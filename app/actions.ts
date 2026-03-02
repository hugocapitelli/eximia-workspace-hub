"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { appSchema, type AppInput } from "@/lib/validations";
import { isValidUUID } from "@/lib/utils";

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

export async function getApps() {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getApp(id: string) {
  if (!isValidUUID(id)) throw new Error("ID inválido");
  const { supabase, user } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createApp(input: AppInput) {
  const parsed = appSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await getAuthenticatedUser();

  const { data: maxSort } = await supabase
    .from("apps")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("apps").insert({
    user_id: user.id,
    name: parsed.data.name,
    url: parsed.data.url,
    description: parsed.data.description || null,
    category: parsed.data.category,
    icon_emoji: parsed.data.icon_emoji || null,
    logo_url: parsed.data.logo_url || null,
    color: parsed.data.color || null,
    credentials_enc: parsed.data.credentials_enc || null,
    credentials_iv: parsed.data.credentials_iv || null,
    sort_order: (maxSort?.sort_order ?? 0) + 1,
  });

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/");
  return { success: true };
}

export async function updateApp(id: string, input: AppInput) {
  if (!isValidUUID(id)) return { error: { _form: ["ID inválido"] } };
  const parsed = appSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("apps")
    .update({
      name: parsed.data.name,
      url: parsed.data.url,
      description: parsed.data.description || null,
      category: parsed.data.category,
      icon_emoji: parsed.data.icon_emoji || null,
      logo_url: parsed.data.logo_url || null,
      color: parsed.data.color || null,
      credentials_enc: parsed.data.credentials_enc || null,
      credentials_iv: parsed.data.credentials_iv || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/");
  return { success: true };
}

export async function updateAppCredentials(
  id: string,
  credentialsEnc: string,
  credentialsIv: string
) {
  if (!isValidUUID(id)) return { error: { _form: ["ID inválido"] } };

  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("apps")
    .update({
      credentials_enc: credentialsEnc || null,
      credentials_iv: credentialsIv || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: { _form: [error.message] } };

  revalidatePath("/");
  revalidatePath(`/apps/${id}/credentials`);
  return { success: true };
}

export async function deleteApp(id: string) {
  if (!isValidUUID(id)) throw new Error("ID inválido");
  const { supabase, user } = await getAuthenticatedUser();
  const { error } = await supabase
    .from("apps")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  return { success: true };
}

export async function toggleFavorite(id: string, current: boolean) {
  if (!isValidUUID(id)) throw new Error("ID inválido");
  const { supabase, user } = await getAuthenticatedUser();
  const { error } = await supabase
    .from("apps")
    .update({ is_favorite: !current })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function uploadLogo(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("Nenhum arquivo enviado");

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new Error(
      "Tipo de arquivo não permitido. Use PNG, JPEG, WebP, SVG ou GIF."
    );
  }

  if (file.size > MAX_LOGO_SIZE) {
    throw new Error("Arquivo deve ter no máximo 2MB");
  }

  const { supabase, user } = await getAuthenticatedUser();

  const ext = file.name.split(".").pop();
  const filename = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("app-logos")
    .upload(filename, file, { upsert: true });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("app-logos").getPublicUrl(filename);

  return publicUrl;
}
