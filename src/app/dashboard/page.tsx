import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserGame } from "@/lib/types";
import LogoutButton from "./logout-button";
import GameList from "./game-list";
import GameSearch from "./game-search";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: games, error } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user.id)
    .order("custom_order", { ascending: true });

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mi colección</h1>
        <LogoutButton />
      </header>

      {error ? (
        <p className="mt-6 text-red-400">Error al cargar los juegos: {error.message}</p>
      ) : (
        <>
          <div className="mt-6">
            <GameSearch />
          </div>
          <GameList games={(games ?? []) as UserGame[]} />
        </>
      )}
    </main>
  );
}
