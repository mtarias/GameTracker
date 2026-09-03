"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Pencil, Check } from "lucide-react";
import type { GameStatus, UserGame } from "@/lib/types";
import { reorderGames, removeGame } from "./actions";
import SortableGameCard from "./sortable-game-card";

type SortMode = "custom" | "alphabetical";

interface Props {
  status: GameStatus;
  games: UserGame[];
}

export default function StatusGameGrid({ status, games }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [editMode, setEditMode] = useState(false);
  const [orderedGames, setOrderedGames] = useState<UserGame[]>([]);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const sortedGames = useMemo(() => {
    if (sortMode === "alphabetical") {
      return [...games].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...games].sort((a, b) => a.custom_order - b.custom_order);
  }, [games, sortMode]);

  useEffect(() => {
    setOrderedGames(sortedGames);
  }, [sortedGames]);

  const canDrag = editMode && sortMode === "custom";

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedGames.findIndex((g) => g.id === active.id);
    const newIndex = orderedGames.findIndex((g) => g.id === over.id);
    const newOrder = arrayMove(orderedGames, oldIndex, newIndex);

    setOrderedGames(newOrder);
    startTransition(() => {
      reorderGames({ status, orderedIds: newOrder.map((g) => g.id) });
    });
  }

  function handleRemove(id: string) {
    setOrderedGames((prev) => prev.filter((g) => g.id !== id));
    startTransition(() => {
      removeGame(id);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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

        <button
          onClick={() => setEditMode((v) => !v)}
          className="flex items-center gap-1 rounded-md border border-neutral-700 px-2.5 py-1 text-sm text-neutral-200"
        >
          {editMode ? <Check size={14} /> : <Pencil size={14} />}
          {editMode ? "Listo" : "Editar"}
        </button>
      </div>

      {orderedGames.length === 0 ? (
        <p className="mt-8 text-neutral-500">No hay juegos en esta lista todavía.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedGames.map((g) => g.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {orderedGames.map((game) => (
                <SortableGameCard
                  key={game.id}
                  game={game}
                  editMode={editMode}
                  draggable={canDrag}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
