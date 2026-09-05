import Image from "next/image";
import Link from "next/link";
import { BarChart3, ExternalLink, Gamepad2, History, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, type GameStatus, type UserGame } from "@/lib/types";
import ShareButton from "@/app/usuario/[username]/share-button";

export default async function PrivateProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .maybeSingle();

  const { data: games } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const userGames = (games ?? []) as UserGame[];
  const { data: favoritesList } = await supabase
    .from("custom_lists")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_builtin", true)
    .maybeSingle();

  const { data: favoriteItems } = favoritesList
    ? await supabase
        .from("custom_list_items")
        .select("custom_order, user_games(*)")
        .eq("custom_list_id", favoritesList.id)
        .order("custom_order", { ascending: true })
        .limit(6)
    : { data: [] };

  const favoriteGames = (favoriteItems ?? [])
    .map((item) => {
      const row = item as unknown as { custom_order: number; user_games: UserGame | null };
      return row.user_games;
    })
    .filter((game): game is UserGame => game !== null);

  const counts = STATUS_ORDER.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<GameStatus, number>,
  );
  for (const game of userGames) {
    if (game.status) counts[game.status] += 1;
  }

  const totalHours = userGames.reduce((total, game) => total + (game.story_length_hours ?? 0), 0);
  const latestCompleted = userGames
    .filter((game) => game.end_date)
    .sort((a, b) => (b.end_date ?? "").localeCompare(a.end_date ?? ""))[0];

  return (
    <main className="space-y-6 px-4 py-6">
      <header>
        <p className="text-sm text-neutral-500">Tu espacio personal</p>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="mt-1 text-neutral-400">@{profile?.username}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/usuario/${profile?.username}`}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200"
          >
            <ExternalLink size={16} />
            Ver perfil público
          </Link>
          {profile?.username && <ShareButton publicUrl={`/usuario/${profile.username}`} />}
        </div>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
          <BarChart3 size={16} />
          Resumen de colección
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Juegos" value={userGames.length} icon={<Gamepad2 size={16} />} />
          <Stat label="Horas jugadas" value={totalHours} icon={<History size={16} />} />
          <Stat label="Completados" value={counts.completed} icon={<Star size={16} />} />
          <Stat label="Jugando" value={counts.playing} icon={<Gamepad2 size={16} />} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-neutral-400 sm:grid-cols-3">
          {STATUS_ORDER.filter((status) => status !== "completed" && status !== "playing").map((status) => (
            <div key={status} className="flex justify-between border-b border-neutral-800 py-1">
              <span>{STATUS_LABELS[status]}</span>
              <span className="text-neutral-200">{counts[status]}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="favorites-heading">
        <h2 id="favorites-heading" className="mb-3 text-sm font-medium text-neutral-300">
          Favoritos
        </h2>
        {favoriteGames.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no tienes juegos favoritos.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            {favoriteGames.map((game) => (
              <li key={game.id}>
                <Link href={`/dashboard/juego/${game.igdb_id}`} className="block">
                  {game.cover_url ? (
                    <Image src={game.cover_url} alt={game.title} width={264} height={352} className="aspect-[3/4] w-full rounded-md object-cover" />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-neutral-900 text-xs text-neutral-600">Sin carátula</div>
                  )}
                  <p className="mt-1 truncate text-sm text-neutral-300">{game.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {latestCompleted && (
        <p className="text-sm text-neutral-400">
          Último juego completado: <span className="text-neutral-200">{latestCompleted.title}</span>
          <span className="text-neutral-500"> · {latestCompleted.end_date}</span>
        </p>
      )}
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500">{icon}{label}</div>
      <p className="mt-1 text-xl font-semibold text-neutral-100">{value}</p>
    </div>
  );
}