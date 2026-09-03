"use server";

import { createClient } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function addGame(params: {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  status: GameStatus;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: last } = await supabase
    .from("user_games")
    .select("custom_order")
    .eq("user_id", user.id)
    .eq("status", params.status)
    .order("custom_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.custom_order ?? -1) + 1;

  const { error } = await supabase.from("user_games").insert({
    user_id: user.id,
    igdb_id: params.igdb_id,
    title: params.title,
    cover_url: params.cover_url,
    status: params.status,
    custom_order: nextOrder,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function reorderGames(params: { status: GameStatus; orderedIds: string[] }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  await Promise.all(
    params.orderedIds.map((id, index) =>
      supabase
        .from("user_games")
        .update({ custom_order: index })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("status", params.status),
    ),
  );

  revalidatePath("/dashboard");
}

export async function removeGame(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { error } = await supabase
    .from("user_games")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
