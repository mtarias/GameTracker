import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart3, Gamepad2, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, STATUS_COLOR_HEX, type GameStatus, type HomeCard } from "@/lib/types";
import { getHomeCardIcon } from "@/lib/home-card-icon";
import BottomNav from "@/app/dashboard/bottom-nav";
import ShareButton from "./share-button";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const { data: games } = await supabase
    .from("user_games")
    .select("status, story_length_hours")
    .eq("user_id", profile.id);

  const counts = STATUS_ORDER.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<GameStatus, number>,
  );
  for (const g of games ?? []) {
    if (g.status) counts[g.status as GameStatus] += 1;
  }
  const totalHours = (games ?? []).reduce(
    (total, game) => total + (game.story_length_hours ?? 0),
    0,
  );
  const { data: customLists } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("user_id", profile.id);

  const listIds = (customLists ?? []).map((l) => l.id);
  const { data: customItems } = await supabase
    .from("custom_list_items")
    .select("custom_list_id")
    .in("custom_list_id", listIds.length > 0 ? listIds : ["00000000-0000-0000-0000-000000000000"]);

  const customCounts: Record<string, number> = {};
  for (const item of customItems ?? []) {
    customCounts[item.custom_list_id] = (customCounts[item.custom_list_id] ?? 0) + 1;
  }

  const { data: homeCards } = await supabase
    .from("home_cards")
    .select("*")
    .eq("user_id", profile.id)
    .order("position", { ascending: true });

  const customListsById = new Map((customLists ?? []).map((l) => [l.id, l]));

  const cards: HomeCard[] = (homeCards ?? [])
    .map((hc): HomeCard | null => {
      if (hc.card_type === "status") {
        const status = hc.card_key as GameStatus;
        return {
          type: "status",
          key: status,
          label: STATUS_LABELS[status],
          iconKey: status,
          color: STATUS_COLOR_HEX[status],
          count: counts[status],
          href: `/usuario/${username}/${status}`,
          isBuiltin: true,
        };
      }

      const list = customListsById.get(hc.card_key);
      if (!list) return null;

      const count = customCounts[list.id] ?? 0;
      if (list.is_builtin && count === 0) return null;

      return {
        type: "custom_list",
        key: list.id,
        label: list.name,
        iconKey: list.icon,
        color: list.color,
        count,
        href: `/usuario/${username}/lista/${list.id}`,
        isBuiltin: list.is_builtin,
      };
    })
    .filter((c): c is HomeCard => c !== null);

  return (
    <main className={`min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 ${isOwner ? "pb-24" : ""}`}>
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
        <p className="text-sm uppercase tracking-wider text-neutral-500">Colección de</p>
        <h1 className="text-2xl font-semibold">{profile.username}</h1>
        {isOwner && <ShareButton publicUrl={`/usuario/${profile.username}`} />}
      </header>

      <div className="mx-auto mt-8 max-w-2xl">
        <section aria-labelledby="public-stats-heading" className="mb-8">
          <h2 id="public-stats-heading" className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
            <BarChart3 size={16} />
            Resumen de colección
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
            <PublicStat label="Juegos" value={(games ?? []).length} icon={<Gamepad2 size={16} />} />
            <PublicStat label="Horas jugadas" value={totalHours} icon={<History size={16} />} />
          </div>
        </section>

        {cards.length === 0 ? (
          <p className="text-neutral-500">Este perfil aún no tiene juegos.</p>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => {
              const Icon = getHomeCardIcon(card);
              return (
                <li key={`${card.type}:${card.key}`}>
                  <Link
                    href={card.href}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 bg-neutral-900 py-6"
                    style={{ borderColor: card.color }}
                  >
                    <Icon size={28} color={card.color} />
                    <span className="text-lg font-medium">
                      {card.label} <span className="opacity-60">{card.count}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isOwner && <BottomNav username={username} />}
    </main>
  );
}

function PublicStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500">{icon}{label}</div>
      <p className="mt-1 text-xl font-semibold text-neutral-100">{value}</p>
    </div>
  );
}
