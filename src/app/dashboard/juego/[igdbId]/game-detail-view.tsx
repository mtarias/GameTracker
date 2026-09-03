"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { getIgdbGameDetail, type IgdbGameDetail } from "@/lib/igdb";
import { STATUS_LABELS, STATUS_ORDER, type CustomList, type GameStatus, type UserGame } from "@/lib/types";
import { STATUS_ICONS } from "@/lib/status-icons";
import { getCustomListIcon } from "@/lib/custom-list-icons";
import {
  addGame,
  moveGameStatus,
  removeGame,
  updateGameCompletion,
  toggleFavorite,
  toggleCustomListItem,
} from "../../actions";

interface Props {
  igdbId: number;
  existingGame: UserGame | null;
  customLists: CustomList[];
  initialMemberships: string[];
}

function youtubeEmbedUrl(videoUrl: string) {
  const id = videoUrl.split("v=")[1];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export default function GameDetailView({ igdbId, existingGame, customLists, initialMemberships }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<IgdbGameDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeShot, setActiveShot] = useState(0);
  const [entryId, setEntryId] = useState<string | null>(existingGame?.id ?? null);
  const [currentStatus, setCurrentStatus] = useState<GameStatus | null>(existingGame?.status ?? null);
  const [applyingStatus, setApplyingStatus] = useState<GameStatus | null>(null);
  const [memberships, setMemberships] = useState<Set<string>>(new Set(initialMemberships));
  const [applyingListId, setApplyingListId] = useState<string | null>(null);

  const favoritesList = customLists.find((l) => l.is_builtin);
  const otherLists = customLists.filter((l) => !l.is_builtin);
  const isFavorite = favoritesList ? memberships.has(favoritesList.id) : false;
  const [endDate, setEndDate] = useState(existingGame?.end_date ?? "");
  const [storyLength, setStoryLength] = useState(
    existingGame?.story_length_hours?.toString() ?? "",
  );
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [, startTransition] = useTransition();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getIgdbGameDetail(igdbId)
      .then(setDetail)
      .catch((err) => setLoadError(err?.message ?? "No se pudo cargar el detalle desde IGDB."));
  }, [igdbId]);

  function scrollToShot(index: number) {
    setActiveShot(index);
    const el = carouselRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  function handleSelectStatus(status: GameStatus) {
    if (!detail || status === currentStatus) return;

    setApplyingStatus(status);
    const previousStatus = currentStatus;
    setCurrentStatus(status);

    startTransition(async () => {
      try {
        if (entryId) {
          await moveGameStatus(entryId, status);
        } else {
          const inserted = await addGame({
            igdb_id: detail.igdb_id,
            title: detail.title,
            cover_url: detail.cover_url,
            release_date: detail.release_date,
            status,
          });
          setEntryId(inserted.id);
        }
      } catch {
        setCurrentStatus(previousStatus);
      } finally {
        setApplyingStatus(null);
      }
    });
  }

  function handleSaveCompletion() {
    if (!entryId) return;
    setSavingCompletion(true);
    startTransition(async () => {
      try {
        await updateGameCompletion(entryId, {
          end_date: endDate || null,
          story_length_hours: storyLength ? Number(storyLength) : null,
        });
      } finally {
        setSavingCompletion(false);
      }
    });
  }

  function handleRemove() {
    if (!entryId) return;
    setRemoving(true);
    startTransition(async () => {
      await removeGame(entryId);
      router.push("/dashboard");
    });
  }

  function handleToggleFavorite() {
    if (!entryId || !favoritesList) return;
    const next = !isFavorite;
    setApplyingListId(favoritesList.id);
    setMemberships((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(favoritesList.id);
      else copy.delete(favoritesList.id);
      return copy;
    });
    startTransition(async () => {
      try {
        await toggleFavorite(entryId, !next);
      } finally {
        setApplyingListId(null);
      }
    });
  }

  function handleToggleCustomList(listId: string) {
    if (!entryId) return;
    const isMember = memberships.has(listId);
    setApplyingListId(listId);
    setMemberships((prev) => {
      const copy = new Set(prev);
      if (isMember) copy.delete(listId);
      else copy.add(listId);
      return copy;
    });
    startTransition(async () => {
      try {
        await toggleCustomListItem(listId, entryId, isMember);
      } finally {
        setApplyingListId(null);
      }
    });
  }

  if (loadError) {
    return <p className="text-red-400">{loadError}</p>;
  }

  if (!detail) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-neutral-500" />
      </div>
    );
  }

  const embedUrl = detail.video_url ? youtubeEmbedUrl(detail.video_url) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {detail.cover_url && (
          <Image
            src={detail.cover_url}
            alt={detail.title}
            width={200}
            height={267}
            className="rounded-lg"
          />
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{detail.title}</h1>
          {entryId && favoritesList && (
            <button
              onClick={handleToggleFavorite}
              disabled={applyingListId === favoritesList.id}
              aria-label="Favorito"
            >
              <Star
                size={22}
                className={isFavorite ? "fill-yellow-400 text-yellow-400" : "text-neutral-500"}
              />
            </button>
          )}
        </div>
        {detail.release_date && (
          <p className="text-sm text-neutral-500">Lanzamiento: {detail.release_date}</p>
        )}
      </div>

      {detail.description && (
        <div>
          <p className={`text-sm text-neutral-300 ${descExpanded ? "" : "line-clamp-3"}`}>
            {detail.description}
          </p>
          <button
            onClick={() => setDescExpanded((v) => !v)}
            className="mt-1 text-sm text-blue-400"
          >
            {descExpanded ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}

      {detail.platforms.length > 0 && (
        <p className="text-sm text-neutral-400">
          <span className="text-neutral-500">Disponible en:</span> {detail.platforms.join(", ")}
        </p>
      )}

      {detail.screenshots.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-neutral-500">Screenshots</p>
          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-md"
          >
            {detail.screenshots.map((url, i) => (
              <Image
                key={url}
                src={url}
                alt={`Screenshot ${i + 1}`}
                width={480}
                height={270}
                className="aspect-video w-full flex-shrink-0 snap-center rounded-md object-cover"
              />
            ))}
          </div>
          {detail.screenshots.length > 1 && (
            <div className="mt-2 flex gap-2">
              {detail.screenshots.slice(0, 4).map((url, i) => (
                <button key={url} onClick={() => scrollToShot(i)} className="flex-1">
                  <Image
                    src={url}
                    alt=""
                    width={120}
                    height={68}
                    className={`aspect-video w-full rounded object-cover ${
                      i === activeShot ? "ring-2 ring-neutral-100" : "opacity-70"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {embedUrl && (
        <div>
          <p className="mb-2 text-sm text-neutral-500">Video</p>
          <iframe
            src={embedUrl}
            className="aspect-video w-full rounded-md"
            allowFullScreen
            title={`Video de ${detail.title}`}
          />
        </div>
      )}

      <div>
        <p className="mb-2 text-sm text-neutral-500">
          {currentStatus ? "Mover a otra lista" : "Agregar a una lista"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_ORDER.map((status) => {
            const Icon = STATUS_ICONS[status];
            const active = status === currentStatus;
            const applying = applyingStatus === status;
            return (
              <button
                key={status}
                disabled={applyingStatus !== null}
                onClick={() => handleSelectStatus(status)}
                className={`flex flex-col items-center gap-1 rounded-md border py-2 text-xs disabled:opacity-60 ${
                  active
                    ? "border-neutral-100 bg-neutral-100 text-neutral-900"
                    : "border-neutral-700 text-neutral-300"
                }`}
              >
                {applying ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>

        {entryId && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-red-900 px-3 py-2 text-sm text-red-400 disabled:opacity-60"
          >
            {removing && <Loader2 size={14} className="animate-spin" />}
            Quitar de mi colección
          </button>
        )}
      </div>

      {entryId && otherLists.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-neutral-500">Mis listas</p>
          <div className="flex flex-wrap gap-2">
            {otherLists.map((list) => {
              const Icon = getCustomListIcon(list.icon);
              const active = memberships.has(list.id);
              const applying = applyingListId === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => handleToggleCustomList(list.id)}
                  disabled={applying}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs disabled:opacity-60 ${
                    active ? "border-neutral-100 text-neutral-100" : "border-neutral-700 text-neutral-400"
                  }`}
                  style={active ? { borderColor: list.color, color: list.color } : undefined}
                >
                  {applying ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  {list.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {entryId && (
        <div className="space-y-3 rounded-md border border-neutral-800 p-3">
          <p className="text-sm text-neutral-500">Datos opcionales</p>

          <label className="block text-sm">
            Fecha de finalización
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-neutral-100"
            />
          </label>

          <label className="block text-sm">
            Duración de historia (horas)
            <input
              type="number"
              min="0"
              step="0.5"
              value={storyLength}
              onChange={(e) => setStoryLength(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-neutral-100"
            />
          </label>

          <button
            onClick={handleSaveCompletion}
            disabled={savingCompletion}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
          >
            {savingCompletion && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
