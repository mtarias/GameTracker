"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { UserGame } from "@/lib/types";

type SortMode = "custom" | "alphabetical";

interface Props {
  games: UserGame[];
}

export default function PublicGameGrid({ games }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("custom");

  const sortedGames = useMemo(() => {
    if (sortMode === "alphabetical") {
      return [...games].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...games].sort((a, b) => a.custom_order - b.custom_order);
  }, [games, sortMode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Orden:</span>
        <button
          onClick={() => setSortMode("custom")}
          className={sortMode === "custom" ? "text-neutral-100" : "text-neutral-500"}
        >
          Manual
        </button>
        <span className="text-neutral-700">·</span>
        <button
          onClick={() => setSortMode("alphabetical")}
          className={sortMode === "alphabetical" ? "text-neutral-100" : "text-neutral-500"}
        >
          Alfabético
        </button>
      </div>

      {sortedGames.length === 0 ? (
        <p className="mt-8 text-neutral-500">No hay juegos en esta lista.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {sortedGames.map((game) => (
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
      )}
    </div>
  );
}
