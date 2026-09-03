"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CUSTOM_LIST_ICON_KEYS, CUSTOM_LIST_COLORS, getCustomListIcon } from "@/lib/custom-list-icons";
import { createCustomList } from "../../actions";

export default function NewCustomListPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CUSTOM_LIST_ICON_KEYS[0]);
  const [color, setColor] = useState(CUSTOM_LIST_COLORS[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await createCustomList({ name: name.trim(), icon, color });
        router.push("/dashboard");
      } catch {
        setError("No se pudo crear la lista.");
      }
    });
  }

  return (
    <main className="px-4 py-6">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400">
        <ArrowLeft size={16} />
        Volver
      </Link>
      <h1 className="mb-4 text-xl font-semibold">Nueva lista</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
          />
        </label>

        <div>
          <p className="mb-2 text-sm">Ícono</p>
          <div className="grid grid-cols-6 gap-2">
            {CUSTOM_LIST_ICON_KEYS.map((key) => {
              const Icon = getCustomListIcon(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`flex items-center justify-center rounded-md border py-2 ${
                    icon === key ? "border-neutral-100" : "border-neutral-700"
                  }`}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm">Color</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_LIST_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-8 w-8 rounded-full border-2 ${
                  color === c ? "border-neutral-100" : "border-transparent"
                }`}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-neutral-100 px-3 py-2 font-medium text-neutral-900 disabled:opacity-60"
        >
          {isPending ? "Creando..." : "Crear lista"}
        </button>
      </form>
    </main>
  );
}
