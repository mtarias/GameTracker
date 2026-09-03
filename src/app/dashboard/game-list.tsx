"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { STATUS_LABELS, STATUS_ORDER, type GameStatus, type UserGame } from "@/lib/types";
import { reorderGames } from "./actions";
import SortableGameCard from "./sortable-game-card";

type SortMode = "custom" | "alphabetical";

interface Props {
  games: UserGame[];
}

export default function GameList({ games }: Props) {
  const [activeStatus, setActiveStatus] = useState<GameStatus>("playing");
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [orderedGames, setOrderedGames] = useState<UserGame[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const countsByStatus = useMemo(() => {
    const counts: Record<GameStatus, number> = {
      playing: 0, completed: 0, backlog: 0, wishlist: 0, endless: 0, abandoned: 0,
    };
    for (const g of games) counts[g.status] += 1;
    return counts;
  }, [games]);

  const visibleGames = useMemo(() => {
    const filtered = games.filter((g) => g.status === activeStatus);
    if (sortMode === "alphabetical") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...filtered].sort((a, b) => a.custom_order - b.custom_order);
  }, [games, activeStatus, sortMode]);

  useEffect(() => {
    setOrderedGames(visibleGames);
  }, [visibleGames]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedGames.findIndex((g) => g.id === active.id);
    const newIndex = orderedGames.findIndex((g) => g.id === over.id);
    const newOrder = arrayMove(orderedGames, oldIndex, newIndex);

    setOrderedGames(newOrder);
    reorderGames({ status: activeStatus, orderedIds: newOrder.map((g) => g.id) });
  }

  const canDrag = sortMode === "custom";

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              activeStatus === s
                ? "bg-neutral-100 text-neutral-900"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {STATUS_LABELS[s]}{" "}
            <span className="ml-1 opacity-60">{countsByStatus[s]}</span>
          </button>
        ))}
      </div>

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

      {orderedGames.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          No hay juegos en {STATUS_LABELS[activeStatus].toLowerCase()} todavía.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedGames.map((g) => g.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {orderedGames.map((game) => (
                <SortableGameCard key={game.id} game={game} draggable={canDrag} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
