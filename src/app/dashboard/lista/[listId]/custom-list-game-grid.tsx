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
import { useRouter } from "next/navigation";
import { Pencil, Check, LayoutGrid, Grid3x3, List as ListIcon, Trash2 } from "lucide-react";
import { SORT_LABELS, type SortMode, type UserGame, type ViewMode } from "@/lib/types";
import { reorderCustomListItems, toggleCustomListItem, deleteCustomList } from "../../actions";
import SortableGameCard from "../../sortable-game-card";

interface Props {
  customListId: string;
  isBuiltin: boolean;
  games: UserGame[];
}

const SORT_OPTIONS: SortMode[] = [
  "custom",
  "alphabetical",
  "alphabetical_desc",
  "recently_completed",
  "release_date",
  "story_length",
];

const VIEW_ICONS: { mode: ViewMode; icon: typeof LayoutGrid }[] = [
  { mode: "grid", icon: LayoutGrid },
  { mode: "compact", icon: Grid3x3 },
  { mode: "list", icon: ListIcon },
];

function sortGames(games: UserGame[], mode: SortMode): UserGame[] {
  const withNullsLast = <T extends string | number>(
    getValue: (g: UserGame) => T | null,
    ascending: boolean,
  ) => {
    return [...games].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return ascending
        ? va < vb ? -1 : va > vb ? 1 : 0
        : va < vb ? 1 : va > vb ? -1 : 0;
    });
  };

  switch (mode) {
    case "alphabetical":
      return [...games].sort((a, b) => a.title.localeCompare(b.title));
    case "alphabetical_desc":
      return [...games].sort((a, b) => b.title.localeCompare(a.title));
    case "recently_completed":
      return withNullsLast((g) => g.end_date, false);
    case "release_date":
      return withNullsLast((g) => g.release_date, false);
    case "story_length":
      return withNullsLast((g) => g.story_length_hours, true);
    case "custom":
    default:
      return [...games].sort((a, b) => a.custom_order - b.custom_order);
  }
}

export default function CustomListGameGrid({ customListId, isBuiltin, games }: Props) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [orderedGames, setOrderedGames] = useState<UserGame[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("gametracker:viewMode") as ViewMode | null;
    if (saved) setViewMode(saved);
  }, []);

  function handleSetViewMode(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem("gametracker:viewMode", mode);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const sortedGames = useMemo(() => sortGames(games, sortMode), [games, sortMode]);

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
      reorderCustomListItems(customListId, newOrder.map((g) => g.id));
    });
  }

  function handleRemove(id: string) {
    setOrderedGames((prev) => prev.filter((g) => g.id !== id));
    startTransition(() => {
      toggleCustomListItem(customListId, id, true);
    });
  }

  function handleDeleteList() {
    if (!confirm("¿Borrar esta lista? Los juegos no se eliminan de tu colección.")) return;
    startTransition(async () => {
      await deleteCustomList(customListId);
      router.push("/dashboard");
    });
  }

  const gridClass = {
    grid: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    compact: "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
    list: "flex flex-col gap-2",
  }[viewMode];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <button
            onClick={() => setSortMenuOpen((v) => !v)}
            className="rounded-md border border-neutral-700 px-2.5 py-1 text-sm text-neutral-200"
          >
            Ordenar: {SORT_LABELS[sortMode]}
          </button>
          {sortMenuOpen && (
            <ul className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg">
              {SORT_OPTIONS.map((mode) => (
                <li key={mode}>
                  <button
                    onClick={() => {
                      setSortMode(mode);
                      setSortMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-sm ${
                      mode === sortMode ? "text-neutral-100" : "text-neutral-400"
                    } hover:bg-neutral-800`}
                  >
                    {SORT_LABELS[mode]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-1">
          {VIEW_ICONS.map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => handleSetViewMode(mode)}
              aria-label={`Vista ${mode}`}
              className={`rounded-md border p-1.5 ${
                viewMode === mode
                  ? "border-neutral-100 text-neutral-100"
                  : "border-neutral-700 text-neutral-500"
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        <button
          onClick={() => setEditMode((v) => !v)}
          className="flex items-center gap-1 rounded-md border border-neutral-700 px-2.5 py-1 text-sm text-neutral-200"
        >
          {editMode ? <Check size={14} /> : <Pencil size={14} />}
          {editMode ? "Listo" : "Editar"}
        </button>
      </div>

      {!isBuiltin && (
        <button
          onClick={handleDeleteList}
          className="flex items-center gap-1 text-sm text-red-400"
        >
          <Trash2 size={14} />
          Borrar esta lista
        </button>
      )}

      {orderedGames.length === 0 ? (
        <p className="mt-8 text-neutral-500">No hay juegos en esta lista todavía.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedGames.map((g) => g.id)} strategy={rectSortingStrategy}>
            <ul className={gridClass}>
              {orderedGames.map((game) => (
                <SortableGameCard
                  key={game.id}
                  game={game}
                  editMode={editMode}
                  draggable={canDrag}
                  viewMode={viewMode}
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
