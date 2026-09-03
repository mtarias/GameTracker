import { createClient } from "@/lib/supabase/server";
import type { UserGame } from "@/lib/types";
import BackButton from "../../back-button";
import GameDetailView from "./game-detail-view";

interface Props {
  params: Promise<{ igdbId: string }>;
}

export default async function GameDetailPage({ params }: Props) {
  const { igdbId } = await params;
  const igdbIdNum = Number(igdbId);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existingGame } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user!.id)
    .eq("igdb_id", igdbIdNum)
    .maybeSingle();

  const { data: customLists } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("user_id", user!.id)
    .order("position", { ascending: true });

  let memberships: string[] = [];
  if (existingGame) {
    const { data: items } = await supabase
      .from("custom_list_items")
      .select("custom_list_id")
      .eq("user_game_id", existingGame.id);
    memberships = (items ?? []).map((i) => i.custom_list_id);
  }

  return (
    <main className="px-4 py-6">
      <BackButton />
      <GameDetailView
        igdbId={igdbIdNum}
        existingGame={existingGame as UserGame | null}
        customLists={customLists ?? []}
        initialMemberships={memberships}
      />
    </main>
  );
}
