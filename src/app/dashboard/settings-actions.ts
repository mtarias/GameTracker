"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; username?: string };

export async function updateUsername(formData: FormData): Promise<ActionResult> {
  const username = String(formData.get("username") ?? "").trim();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "Usa entre 3 y 24 caracteres: letras, números o guion bajo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!currentProfile) return { error: "No se encontró tu perfil." };

  const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);

  if (error) {
    return { error: error.code === "23505" ? "Ese username ya está ocupado." : error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath(`/usuario/${currentProfile.username}`);
  revalidatePath(`/usuario/${username}`);

  return { username };
}

export async function updateAbandonedPreference(formData: FormData): Promise<ActionResult> {
  const includeAbandoned = formData.get("includeAbandoned") === "on";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ include_abandoned_in_total: includeAbandoned })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/perfil");
  return {};
}