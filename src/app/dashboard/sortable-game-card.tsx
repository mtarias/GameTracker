"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { UserGame } from "@/lib/types";

interface Props {
  game: UserGame;
  editMode: boolean;
  draggable: boolean;
  onRemove: (id: string) => void;
}

export default function SortableGameCard({ game, editMode, draggable, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-md bg-neutral-900"
    >
      {game.cover_url ? (
        <Image
          src={game.cover_url}
          alt={game.title}
          width={264}
          height={352}
          className="aspect-[3/4] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center text-neutral-600">
          Sin carátula
        </div>
      )}
      <p className="truncate px-2 py-1.5 text-sm text-neutral-200">{game.title}</p>

      {editMode && (
        <button
          onClick={() => onRemove(game.id)}
          aria-label={`Quitar ${game.title}`}
          className="absolute right-1 top-1 rounded-full bg-neutral-950/80 p-1 text-neutral-100"
        >
          <X size={16} />
        </button>
      )}

      {editMode && draggable && (
        <span
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 touch-none rounded-full bg-neutral-950/80 p-1 text-neutral-100 active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </span>
      )}
    </li>
  );
}
