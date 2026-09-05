import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "../settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, include_abandoned_in_total")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <main className="space-y-6 px-4 py-6">
      <header className="flex items-center gap-3">
        <Link href="/dashboard" aria-label="Volver al inicio" className="text-neutral-400">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-sm text-neutral-500">Tu cuenta</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Settings size={22} />
            Ajustes
          </h1>
        </div>
      </header>

      <SettingsForm
        username={profile?.username ?? ""}
        includeAbandonedInTotal={profile?.include_abandoned_in_total ?? false}
      />
    </main>
  );
}