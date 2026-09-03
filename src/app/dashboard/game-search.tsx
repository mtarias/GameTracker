"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { searchIgdbGames, type IgdbSearchResult } from "@/lib/igdb";
import { STATUS_LABELS, STATUS_ORDER, type GameStatus } from "@/lib/types";
import { addGame } from "./actions";

export default function GameSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    try {
      const data = await searchIgdbGames(query.trim());
      setResults(data);
    } catch {
      setError("No se pudo buscar en IGDB. Probá de nuevo.");
    } finally {
      setSearching(false);
    }
  }

  function handleAdd(game: IgdbSearchResult, status: GameStatus) {
    setPendingId(game.igdb_id);
    startTransition(async () => {
      try {
        await addGame({
          igdb_id: game.igdb_id,
          title: game.title,
          cover_url: game.cover_url,
          status,
        });
        setResults((prev) => prev.filter((g) => g.igdb_id !== game.igdb_id));
      } catch {
        setError("No se pudo agregar el juego.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar juego en IGDB..."
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-md bg-neutral-100 px-4 py-2 font-medium text-neutral-900 disabled:opacity-50"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {results.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {results.map((game) => (
            <li key={game.igdb_id} className="rounded-md bg-neutral-800 p-2">
              {game.cover_url ? (
                <Image
                  src={game.cover_url}
                  alt={game.title}
                  width={264}
                  height={352}
                  className="aspect-[3/4] w-full rounded object-cover"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded bg-neutral-700 text-xs text-neutral-500">
                  Sin carátula
                </div>
              )}
              <p className="mt-1 truncate text-sm text-neutral-200">{game.title}</p>
              <select
                disabled={isPending && pendingId === game.igdb_id}
                defaultValue=""
                onChange={(e) => handleAdd(game, e.target.value as GameStatus)}
                className="mt-1 w-full rounded border border-neutral-600 bg-neutral-900 px-1 py-1 text-xs text-neutral-200"
              >
                <option value="" disabled>
                  Agregar a...
                </option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
