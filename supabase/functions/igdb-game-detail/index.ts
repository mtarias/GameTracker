// Supabase Edge Function: detalle completo de un juego de IGDB por igdb_id.
// Reutiliza el mismo cache de token de Twitch que igdb-search.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOKEN_EXPIRY_BUFFER_SECONDS = 300;

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
    const { igdb_id } = await req.json();

    if (!igdb_id || typeof igdb_id !== "number") {
      return new Response(JSON.stringify({ error: "Missing 'igdb_id' number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("TWITCH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET")!;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const accessToken = await getTwitchToken(supabaseAdmin, clientId, clientSecret);

    const apicalypseQuery =
      `fields name,cover.url,first_release_date,summary,screenshots.url,platforms.name,videos.video_id; where id = ${igdb_id};`;

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
    const game = games[0];

    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = {
      igdb_id: game.id,
      title: game.name,
      cover_url: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      release_date: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      description: game.summary ?? null,
      screenshots: (game.screenshots ?? []).map((s: { url: string }) =>
        `https:${s.url.replace("t_thumb", "t_screenshot_big")}`,
      ),
      platforms: (game.platforms ?? []).map((p: { name: string }) => p.name),
      video_url: game.videos?.[0]?.video_id
        ? `https://www.youtube.com/watch?v=${game.videos[0].video_id}`
        : null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
