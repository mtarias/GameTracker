import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { UserGame } from "@/lib/types";
import CustomListGameGrid from "./custom-list-game-grid";

interface Props {
  params: Promise<{ listId: string }>;
}

export default async function CustomListPage({ params }: Props) {
  const { listId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: list } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!list) {
    notFound();
  }

  const { data: items, error } = await supabase
    .from("custom_list_items")
    .select("user_games(*)")
    .eq("custom_list_id", listId);

  const games = (items ?? [])
    .map((item) => (item as unknown as { user_games: UserGame | null }).user_games)
    .filter((g): g is UserGame => g !== null);

  return (
    <main className="px-4 py-6">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400">
        <ArrowLeft size={16} />
        Volver
      </Link>
      <h1 className="mb-4 text-xl font-semibold">{list.name}</h1>

      {error ? (
        <p className="text-red-400">Error al cargar: {error.message}</p>
      ) : (
        <CustomListGameGrid
          customListId={listId}
          listName={list.name}
          isBuiltin={list.is_builtin}
          games={games}
        />
      )}
    </main>
  );
}
