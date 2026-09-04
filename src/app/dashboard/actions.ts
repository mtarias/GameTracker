"use server";

import { createClient } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function addGame(params: {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  status: GameStatus | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  let nextOrder = 0;
  if (params.status) {
    const { data: first } = await supabase
      .from("user_games")
      .select("custom_order")
      .eq("user_id", user.id)
      .eq("status", params.status)
      .order("custom_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    nextOrder = (first?.custom_order ?? 0) - 1;
  }

  const { data: inserted, error } = await supabase
    .from("user_games")
    .insert({
      user_id: user.id,
      igdb_id: params.igdb_id,
      title: params.title,
      cover_url: params.cover_url,
      release_date: params.release_date,
      status: params.status,
      custom_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return inserted;
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

export async function moveGameStatus(id: string, newStatus: GameStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: first } = await supabase
    .from("user_games")
    .select("custom_order")
    .eq("user_id", user.id)
    .eq("status", newStatus)
    .order("custom_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextOrder = (first?.custom_order ?? 0) - 1;

  const { error } = await supabase
    .from("user_games")
    .update({ status: newStatus, custom_order: nextOrder })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function updateGameCompletion(
  id: string,
  params: { end_date: string | null; story_length_hours: number | null },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { error } = await supabase
    .from("user_games")
    .update({ end_date: params.end_date, story_length_hours: params.story_length_hours })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function reorderCustomListItems(customListId: string, orderedUserGameIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  await Promise.all(
    orderedUserGameIds.map((userGameId, index) =>
      supabase
        .from("custom_list_items")
        .update({ custom_order: index })
        .eq("custom_list_id", customListId)
        .eq("user_game_id", userGameId),
    ),
  );

  revalidatePath("/dashboard");
}

export async function createCustomList(params: { name: string; icon: string; color: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: last } = await supabase
    .from("custom_lists")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? -1) + 1;

  const { data: insertedList, error } = await supabase
    .from("custom_lists")
    .insert({
      user_id: user.id,
      name: params.name,
      icon: params.icon,
      color: params.color,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: lastCard } = await supabase
    .from("home_cards")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("home_cards").insert({
    user_id: user.id,
    card_type: "custom_list",
    card_key: insertedList.id,
    position: (lastCard?.position ?? -1) + 1,
  });

  revalidatePath("/dashboard");
}

export async function deleteCustomList(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { error } = await supabase
    .from("custom_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_builtin", false);

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("home_cards")
    .delete()
    .eq("user_id", user.id)
    .eq("card_type", "custom_list")
    .eq("card_key", id);

  revalidatePath("/dashboard");
}

export async function renameCustomList(id: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("El nombre no puede estar vacío");
  }

  const { error } = await supabase
    .from("custom_lists")
    .update({ name: trimmedName })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_builtin", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/lista/${id}`);
}

export async function reorderHomeCards(
  orderedCards: { type: "status" | "custom_list"; key: string }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  await Promise.all(
    orderedCards.map((card, index) =>
      supabase
        .from("home_cards")
        .update({ position: index })
        .eq("user_id", user.id)
        .eq("card_type", card.type)
        .eq("card_key", card.key),
    ),
  );

  revalidatePath("/dashboard");
}

export async function toggleCustomListItem(
  customListId: string,
  userGameId: string,
  isMember: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  if (isMember) {
    const { error } = await supabase
      .from("custom_list_items")
      .delete()
      .eq("custom_list_id", customListId)
      .eq("user_game_id", userGameId);

    if (error) throw new Error(error.message);
  } else {
    const { data: first } = await supabase
      .from("custom_list_items")
      .select("custom_order")
      .eq("custom_list_id", customListId)
      .order("custom_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const nextOrder = (first?.custom_order ?? 0) - 1;

    const { error } = await supabase
      .from("custom_list_items")
      .insert({ custom_list_id: customListId, user_game_id: userGameId, custom_order: nextOrder });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function toggleFavorite(userGameId: string, isFavorite: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: favList } = await supabase
    .from("custom_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_builtin", true)
    .maybeSingle();

  if (!favList) {
    throw new Error("No se encontró la lista de Favoritos");
  }

  await toggleCustomListItem(favList.id, userGameId, isFavorite);
}
