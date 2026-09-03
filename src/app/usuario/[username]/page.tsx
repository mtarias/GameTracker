import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, type GameStatus, type UserGame } from "@/lib/types";
import { getCustomListIcon } from "@/lib/custom-list-icons";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: games } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", profile.id)
    .order("custom_order", { ascending: true });

  const gamesByStatus = (games ?? []).reduce<Record<GameStatus, UserGame[]>>(
    (acc, game) => {
      const g = game as UserGame;
      if (g.status) (acc[g.status] ??= []).push(g);
      return acc;
    },
    { playing: [], completed: [], backlog: [], wishlist: [], endless: [], abandoned: [] },
  );

  const { data: customLists } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("user_id", profile.id)
    .order("position", { ascending: true });

  const customListsWithGames = await Promise.all(
    (customLists ?? []).map(async (list) => {
      const { data: items } = await supabase
        .from("custom_list_items")
        .select("custom_order, user_games(*)")
        .eq("custom_list_id", list.id)
        .order("custom_order", { ascending: true });

      const listGames = (items ?? [])
        .map((item) => (item as unknown as { user_games: UserGame | null }).user_games)
        .filter((g): g is UserGame => g !== null);

      return { list, games: listGames };
    }),
  );

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
      <header className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-wider text-neutral-500">Colección de</p>
        <h1 className="text-2xl font-semibold">{profile.username}</h1>
      </header>

      <div className="mx-auto mt-8 max-w-6xl space-y-10">
        {STATUS_ORDER.map((status) => {
          const list = gamesByStatus[status];
          if (list.length === 0) return null;

          return (
            <section key={status}>
              <h2 className="mb-3 text-lg font-medium text-neutral-200">
                {STATUS_LABELS[status]}{" "}
                <span className="ml-1 text-sm text-neutral-500">{list.length}</span>
              </h2>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {list.map((game) => (
                  <li key={game.id} className="overflow-hidden rounded-md bg-neutral-900">
                    {game.cover_url ? (
                      <Image
                        src={game.cover_url}
                        alt={game.title}
                        width={264}
                        height={352}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center text-xs text-neutral-600">
                        Sin carátula
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {customListsWithGames.map(({ list, games: listGames }) => {
          if (listGames.length === 0) return null;
          const Icon = getCustomListIcon(list.icon);

          return (
            <section key={list.id}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-neutral-200">
                <Icon size={18} color={list.color} />
                {list.name}{" "}
                <span className="ml-1 text-sm text-neutral-500">{listGames.length}</span>
              </h2>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {listGames.map((game) => (
                  <li key={game.id} className="overflow-hidden rounded-md bg-neutral-900">
                    {game.cover_url ? (
                      <Image
                        src={game.cover_url}
                        alt={game.title}
                        width={264}
                        height={352}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center text-xs text-neutral-600">
                        Sin carátula
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {(games ?? []).length === 0 && (
          <p className="text-neutral-500">Este perfil aún no tiene juegos.</p>
        )}
      </div>
    </main>
  );
}
