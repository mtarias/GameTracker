import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "./bottom-nav";

export const metadata: Metadata = {
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GameTracker" },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 text-neutral-100">
      {children}
      <BottomNav username={profile?.username ?? ""} />
    </div>
  );
}
