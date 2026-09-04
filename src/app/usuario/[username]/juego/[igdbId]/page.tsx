import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/app/dashboard/bottom-nav";
import GameDetailView from "@/app/dashboard/juego/[igdbId]/game-detail-view";

interface Props {
  params: Promise<{ username: string; igdbId: string }>;
}

export default async function PublicGameDetailPage({ params }: Props) {
  const { username, igdbId } = await params;
  const igdbIdNum = Number(igdbId);

  if (!Number.isInteger(igdbIdNum)) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={`min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 ${user?.id === profile.id ? "pb-24" : ""}`}>
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/usuario/${username}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400"
        >
          <ArrowLeft size={16} />
          Volver al perfil
        </Link>
        <GameDetailView
          igdbId={igdbIdNum}
          existingGame={null}
          customLists={[]}
          initialMemberships={[]}
          readOnly
        />
      </div>
      {user?.id === profile.id && <BottomNav username={username} />}
    </main>
  );
}