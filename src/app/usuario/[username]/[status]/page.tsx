import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, type GameStatus, type UserGame } from "@/lib/types";
import BottomNav from "@/app/dashboard/bottom-nav";
import PublicGameGrid from "../public-game-grid";

interface Props {
  params: Promise<{ username: string; status: string }>;
}

export default async function PublicStatusPage({ params }: Props) {
  const { username, status } = await params;

  if (!STATUS_ORDER.includes(status as GameStatus)) {
    notFound();
  }
  const typedStatus = status as GameStatus;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const { data: games } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", profile.id)
    .eq("status", typedStatus);

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
        <h1 className="mb-4 text-xl font-semibold">{STATUS_LABELS[typedStatus]}</h1>

        <PublicGameGrid games={(games ?? []) as UserGame[]} />
      </div>

      {isOwner && <BottomNav username={username} />}
    </main>
  );
}
