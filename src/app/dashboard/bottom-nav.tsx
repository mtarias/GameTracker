"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  username: string;
}

const items = (username: string) => [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/buscar", label: "Buscar", icon: Search },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
];

export default function BottomNav({ username }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items(username).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs ${
                  active ? "text-neutral-100" : "text-neutral-500"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            onClick={handleLogout}
            className="flex w-full flex-col items-center gap-1 py-2.5 text-xs text-neutral-500"
          >
            <LogOut size={20} />
            Salir
          </button>
        </li>
      </ul>
    </nav>
  );
}
