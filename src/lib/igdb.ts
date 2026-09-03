import { createClient } from "@/lib/supabase/client";

export interface IgdbSearchResult {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_date: string | null;
}

export async function searchIgdbGames(search: string): Promise<IgdbSearchResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke<IgdbSearchResult[]>(
    "igdb-search",
    { body: { search } },
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}
