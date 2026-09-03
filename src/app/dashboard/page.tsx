import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, STATUS_BORDER_COLOR, type GameStatus } from "@/lib/types";
import { STATUS_ICONS } from "@/lib/status-icons";
import { getCustomListIcon } from "@/lib/custom-list-icons";

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
  for (const g of games ?? []) counts[g.status as GameStatus] += 1;

  const { data: customLists } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("user_id", user!.id)
    .order("position", { ascending: true });

  const listIds = (customLists ?? []).map((l) => l.id);
  const { data: customItems } = await supabase
    .from("custom_list_items")
    .select("custom_list_id")
    .in("custom_list_id", listIds.length > 0 ? listIds : ["00000000-0000-0000-0000-000000000000"]);

  const customCounts: Record<string, number> = {};
  for (const item of customItems ?? []) {
    customCounts[item.custom_list_id] = (customCounts[item.custom_list_id] ?? 0) + 1;
  }

  const favoritesList = customLists?.find((l) => l.is_builtin);
  const otherLists = customLists?.filter((l) => !l.is_builtin) ?? [];
  const visibleCustomLists = [
    ...(favoritesList && (customCounts[favoritesList.id] ?? 0) > 0 ? [favoritesList] : []),
    ...otherLists,
  ];

  return (
    <main className="px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Mi colección</h1>

      {error && <p className="mb-4 text-red-400">Error al cargar: {error.message}</p>}

      <ul className="space-y-3">
        {STATUS_ORDER.map((status) => {
          const Icon = STATUS_ICONS[status];
          return (
            <li key={status}>
              <Link
                href={`/dashboard/${status}`}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 bg-neutral-900 py-6 ${STATUS_BORDER_COLOR[status]}`}
              >
                <Icon size={28} />
                <span className="text-lg font-medium">
                  {STATUS_LABELS[status]} <span className="opacity-60">{counts[status]}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mb-3 mt-8 text-sm font-medium text-neutral-500">Mis listas</h2>
      <ul className="space-y-3">
        {visibleCustomLists.map((list) => {
          const Icon = getCustomListIcon(list.icon);
          return (
            <li key={list.id}>
              <Link
                href={`/dashboard/lista/${list.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border-2 bg-neutral-900 py-6"
                style={{ borderColor: list.color }}
              >
                <Icon size={28} color={list.color} />
                <span className="text-lg font-medium">
                  {list.name} <span className="opacity-60">{customCounts[list.id] ?? 0}</span>
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/dashboard/lista/nueva"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 py-4 text-neutral-400"
          >
            <Plus size={20} />
            Nueva lista
          </Link>
        </li>
      </ul>
    </main>
  );
}
