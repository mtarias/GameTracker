// Supabase Edge Function: proxy de búsqueda de IGDB.
// Cachea el token OAuth de Twitch en public.twitch_auth_cache para no pedirlo en cada búsqueda.
// Requiere estar autenticado con Supabase (se invoca con supabase.functions.invoke desde el frontend).

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOKEN_EXPIRY_BUFFER_SECONDS = 300; // renovar 5 min antes de que expire

async function getTwitchToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  clientId: string,
  clientSecret: string,
) {
  const { data: cached } = await supabaseAdmin
    .from("twitch_auth_cache")
    .select("access_token, expires_at")
    .eq("id", 1)
    .maybeSingle();

  const now = Date.now();
  if (
    cached?.access_token &&
    cached.expires_at &&
    new Date(cached.expires_at).getTime() - TOKEN_EXPIRY_BUFFER_SECONDS * 1000 > now
  ) {
    return cached.access_token as string;
  }

  const tokenResponse = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: "POST" },
  );

  if (!tokenResponse.ok) {
    throw new Error(`Twitch token request failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  const expiresAt = new Date(now + tokenData.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from("twitch_auth_cache")
    .upsert({ id: 1, access_token: tokenData.access_token, expires_at: expiresAt });

  return tokenData.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { search, offset, includeDlc } = await req.json();

    if (!search || typeof search !== "string" || search.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'search' string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageOffset = typeof offset === "number" && offset > 0 ? offset : 0;

    const clientId = Deno.env.get("TWITCH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET")!;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const accessToken = await getTwitchToken(supabaseAdmin, clientId, clientSecret);

    // Escapar comillas dobles del input para evitar romper la query Apicalypse.
    const safeSearch = search.replace(/"/g, '\\"');
    // Se pide de mas (40) porque el filtro de categoria se aplica despues, en JS.
    const fetchLimit = includeDlc ? 20 : 40;
    const apicalypseQuery =
      `search "${safeSearch}"; fields name,cover.url,first_release_date,platforms.name,category; ` +
      `limit ${fetchLimit}; offset ${pageOffset};`;

    const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      body: apicalypseQuery,
    });

    if (!igdbResponse.ok) {
      const errorText = await igdbResponse.text();
      throw new Error(`IGDB request failed: ${igdbResponse.status} ${errorText}`);
    }

    const games = await igdbResponse.json();

    // category: 0 main_game, 8 remake, 9 remaster, 10 expanded_game, 11 port.
    // Excluye asi dlc_addon(1), expansion(2), bundle(3), standalone_expansion(4), mod(5), episode(6), season(7).
    const allowedCategories = [0, 8, 9, 10, 11];
    const filtered = includeDlc
      ? games
      : games.filter((game: { category?: number }) =>
          game.category === undefined || allowedCategories.includes(game.category),
        );

    const results = filtered.slice(0, 20).map((game: {
      id: number;
      name: string;
      cover?: { url: string };
      first_release_date?: number;
      platforms?: { name: string }[];
    }) => ({
      igdb_id: game.id,
      title: game.name,
      // IGDB devuelve URLs protocol-relative en baja resolución; se pide alta resolución.
      cover_url: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      release_date: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      platforms: (game.platforms ?? []).map((p) => p.name),
    }));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
