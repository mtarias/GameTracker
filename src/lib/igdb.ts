import { createClient } from "@/lib/supabase/client";

export interface IgdbSearchResult {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  platforms: string[];
}

export interface IgdbGameDetail extends IgdbSearchResult {
  description: string | null;
  screenshots: string[];
  platforms: string[];
  video_url: string | null;
}

export async function searchIgdbGames(
  search: string,
  offset = 0,
  includeDlc = false,
): Promise<IgdbSearchResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke<IgdbSearchResult[]>(
    "igdb-search",
    { body: { search, offset, includeDlc } },
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getIgdbGameDetail(igdb_id: number): Promise<IgdbGameDetail> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke<IgdbGameDetail>(
    "igdb-game-detail",
    { body: { igdb_id } },
  );

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Juego no encontrado en IGDB");
  }

  return data;
}
