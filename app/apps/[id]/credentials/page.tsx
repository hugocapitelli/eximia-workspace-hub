import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CredentialsPage } from "@/components/credentials-page";

interface CredentialsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AppCredentialsPage({
  params,
}: CredentialsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from("apps")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!app) notFound();

  return <CredentialsPage app={app} userId={user.id} />;
}
