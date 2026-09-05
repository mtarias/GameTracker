"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Settings, User } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/buscar", label: "Buscar", icon: Search },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
  { href: "/dashboard/ajustes", label: "Ajustes", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
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
      </ul>
    </nav>
  );
}
