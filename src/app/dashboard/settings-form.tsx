"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAbandonedPreference, updateUsername } from "./settings-actions";

interface Props {
  username: string;
  includeAbandonedInTotal: boolean;
}

export default function SettingsForm({ username, includeAbandonedInTotal }: Props) {
  const router = useRouter();
  const [newUsername, setNewUsername] = useState(username);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);

  async function handleUsernameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameMessage(null);
    setUsernameLoading(true);
    const result = await updateUsername(new FormData(event.currentTarget));
    setUsernameLoading(false);

    if (result.error) {
      setUsernameMessage(result.error);
      return;
    }

    setUsernameMessage("Username actualizado.");
    router.refresh();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (password.length < 6) {
      setPasswordMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setPasswordMessage("Las contraseñas no coinciden.");
      return;
    }

    setPasswordLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setPasswordLoading(false);

    if (error) {
      setPasswordMessage(error.message);
      return;
    }

    setPassword("");
    setPasswordConfirmation("");
    setPasswordMessage("Contraseña actualizada.");
  }

  async function handlePreferenceChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPreferenceMessage(null);
    const form = event.currentTarget.form;
    if (!form) return;

    const result = await updateAbandonedPreference(new FormData(form));
    if (result.error) setPreferenceMessage(result.error);
    else router.refresh();
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-md border border-neutral-800 bg-neutral-900 p-4">
        <div>
          <h2 className="font-medium">Username</h2>
          <p className="mt-1 text-sm text-neutral-500">Es el nombre que aparece en tu perfil público.</p>
        </div>
        <form onSubmit={handleUsernameSubmit} className="space-y-3">
          <input
            name="username"
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
            maxLength={24}
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
          />
          <button
            type="submit"
            disabled={usernameLoading}
            className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {usernameLoading ? "Guardando..." : "Guardar username"}
          </button>
          {usernameMessage && <p className="text-sm text-neutral-400">{usernameMessage}</p>}
        </form>
      </section>

      <section className="space-y-3 rounded-md border border-neutral-800 bg-neutral-900 p-4">
        <div>
          <h2 className="font-medium">Contraseña</h2>
          <p className="mt-1 text-sm text-neutral-500">Cámbiala desde aquí sin modificar tu email.</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 placeholder:text-neutral-600"
          />
          <input
            type="password"
            placeholder="Repite la contraseña"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {passwordLoading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
          {passwordMessage && <p className="text-sm text-neutral-400">{passwordMessage}</p>}
        </form>
      </section>

      <section className="space-y-3 rounded-md border border-neutral-800 bg-neutral-900 p-4">
        <div>
          <h2 className="font-medium">Resumen de colección</h2>
          <p className="mt-1 text-sm text-neutral-500">Define qué cuenta en el total de juegos de tu perfil.</p>
        </div>
        <form>
          <label className="flex items-start gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="includeAbandoned"
              defaultChecked={includeAbandonedInTotal}
              onChange={handlePreferenceChange}
              className="mt-0.5 size-4 accent-neutral-100"
            />
            <span>Incluir juegos abandonados en el total</span>
          </label>
        </form>
        {preferenceMessage && <p className="text-sm text-red-400">{preferenceMessage}</p>}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-md border border-red-900 px-3 py-2 text-sm font-medium text-red-300"
      >
        Salir de la cuenta
      </button>
    </div>
  );
}