import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, STATUS_BORDER_COLOR, type GameStatus } from "@/lib/types";
import { STATUS_ICONS } from "@/lib/status-icons";

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
    </main>
  );
}
