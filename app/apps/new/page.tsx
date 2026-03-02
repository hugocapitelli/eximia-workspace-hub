import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppForm } from "@/components/app-form";

export default async function NewAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <AppForm userId={user.id} />;
}
