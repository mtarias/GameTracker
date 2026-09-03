"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { UserGame } from "@/lib/types";

interface Props {
  game: UserGame;
  draggable: boolean;
}

export default function SortableGameCard({ game, draggable }: Props) {
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
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={`overflow-hidden rounded-md bg-neutral-900 ${draggable ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
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
    </li>
  );
}
