import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import Loading from "./loading";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: apps } = await supabase
    .from("apps")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <Suspense fallback={<Loading />}>
      <DashboardShell apps={apps ?? []} />
    </Suspense>
  );
}
