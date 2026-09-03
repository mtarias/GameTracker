import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-neutral-100">
      <h1 className="text-2xl font-semibold">GameTracker</h1>
      <p className="mt-2 text-neutral-400">Mi colección de videojuegos, ordenada.</p>
      <Link
        href="/login"
        className="mt-6 rounded-md bg-neutral-100 px-4 py-2 font-medium text-neutral-900"
      >
        Ingresar
      </Link>
    </main>
  );
}

