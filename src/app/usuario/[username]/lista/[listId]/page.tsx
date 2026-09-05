import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { UserGame } from "@/lib/types";
import BottomNav from "@/app/dashboard/bottom-nav";
import PublicGameGrid from "../../public-game-grid";

interface Props {
  params: Promise<{ username: string; listId: string }>;
}

export default async function PublicCustomListPage({ params }: Props) {
  const { username, listId } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: list } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!list) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const { data: items } = await supabase
    .from("custom_list_items")
    .select("custom_order, user_games(*)")
    .eq("custom_list_id", listId);

  const games = (items ?? [])
    .map((item) => {
      const row = item as unknown as { custom_order: number; user_games: UserGame | null };
      return row.user_games ? { ...row.user_games, custom_order: row.custom_order } : null;
    })
    .filter((g): g is UserGame => g !== null);

  return (
    <main className={`min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 ${isOwner ? "pb-24" : ""}`}>
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/usuario/${username}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1 className="mb-4 text-xl font-semibold">{list.name}</h1>

        <PublicGameGrid username={username} games={games} />
      </div>

      {isOwner && <BottomNav username={username} />}
    </main>
  );
}
