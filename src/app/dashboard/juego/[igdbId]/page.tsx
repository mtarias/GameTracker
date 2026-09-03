import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { UserGame } from "@/lib/types";
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

  return (
    <main className="px-4 py-6">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400">
        <ArrowLeft size={16} />
        Volver
      </Link>
      <GameDetailView igdbId={igdbIdNum} existingGame={existingGame as UserGame | null} />
    </main>
  );
}
