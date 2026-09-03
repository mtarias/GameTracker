"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Check, GripVertical, Plus } from "lucide-react";
import type { HomeCard } from "@/lib/types";
import { getHomeCardIcon } from "@/lib/home-card-icon";
import { reorderHomeCards } from "./actions";

interface Props {
  cards: HomeCard[];
}

function SortableCard({ card, editMode }: { card: HomeCard; editMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${card.type}:${card.key}`,
    disabled: !editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getHomeCardIcon(card);

  const content = (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border-2 bg-neutral-900 py-6"
      style={{ borderColor: card.color }}
    >
      <Icon size={28} color={card.color} />
      <span className="text-lg font-medium">
        {card.label} <span className="opacity-60">{card.count}</span>
      </span>
    </div>
  );

  return (
    <li ref={setNodeRef} style={style} className="relative">
      {editMode ? (
        content
      ) : (
        <Link href={card.href} className="block">
          {content}
        </Link>
      )}
      {editMode && (
        <span
          {...attributes}
          {...listeners}
          className="absolute right-3 top-3 touch-none rounded-full bg-neutral-950/80 p-1.5 text-neutral-100 active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </span>
      )}
    </li>
  );
}

export default function HomeCardsList({ cards: initialCards }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [editMode, setEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = cards.map((c) => `${c.type}:${c.key}`);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const newOrder = arrayMove(cards, oldIndex, newIndex);

    setCards(newOrder);
    reorderHomeCards(newOrder.map((c) => ({ type: c.type, key: c.key })));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setEditMode((v) => !v)}
          className="flex items-center gap-1 rounded-md border border-neutral-700 px-2.5 py-1 text-sm text-neutral-200"
        >
          {editMode ? <Check size={14} /> : <Pencil size={14} />}
          {editMode ? "Listo" : "Editar"}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={cards.map((c) => `${c.type}:${c.key}`)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {cards.map((card) => (
              <SortableCard key={`${card.type}:${card.key}`} card={card} editMode={editMode} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <Link
        href="/dashboard/lista/nueva"
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 py-4 text-neutral-400"
      >
        <Plus size={20} />
        Nueva lista
      </Link>
    </div>
  );
}
