import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, STATUS_COLOR_HEX, type GameStatus, type HomeCard } from "@/lib/types";
import HomeCardsList from "./home-cards-list";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .from("user_games")
    .select("status")
    .eq("user_id", user!.id);

  const counts = STATUS_ORDER.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<GameStatus, number>,
  );
  for (const g of games ?? []) {
    if (g.status) counts[g.status as GameStatus] += 1;
  }

  const { data: customLists } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("user_id", user!.id);

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
    .eq("user_id", user!.id)
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
          href: `/dashboard/${status}`,
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
        href: `/dashboard/lista/${list.id}`,
        isBuiltin: list.is_builtin,
      };
    })
    .filter((c): c is HomeCard => c !== null);

  return (
    <main className="px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Mi colección</h1>

      {error && <p className="mb-4 text-red-400">Error al cargar: {error.message}</p>}

      <HomeCardsList cards={cards} />
    </main>
  );
}
