import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, type GameStatus, type UserGame } from "@/lib/types";
import StatusGameGrid from "../status-game-grid";

interface Props {
  params: Promise<{ status: string }>;
}

export default async function StatusPage({ params }: Props) {
  const { status } = await params;

  if (!STATUS_ORDER.includes(status as GameStatus)) {
    notFound();
  }
  const typedStatus = status as GameStatus;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", typedStatus);

  return (
    <main className="px-4 py-6">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400">
        <ArrowLeft size={16} />
        Volver
      </Link>
      <h1 className="mb-4 text-xl font-semibold">{STATUS_LABELS[typedStatus]}</h1>

      {error ? (
        <p className="text-red-400">Error al cargar: {error.message}</p>
      ) : (
        <StatusGameGrid status={typedStatus} games={(games ?? []) as UserGame[]} />
      )}
    </main>
  );
}
