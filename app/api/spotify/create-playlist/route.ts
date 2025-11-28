import { NextResponse } from "next/server";

/**
 * Extract OAuth tokens from cookies
 */
function getTokens(req: Request) {
  const cookie = req.headers.get("cookie") || "";

  const access = cookie.match(/spotify_access_token=([^;]+)/)?.[1] || null;
  const refresh = cookie.match(/spotify_refresh_token=([^;]+)/)?.[1] || null;

  return { access, refresh };
}

/**
 * Refresh access token
 */
async function refreshAccess(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  return res.json();
}

export async function POST(req: Request) {
  const body = await req.json();
  const { rankedSongs, playlistName } = body;

  const { access, refresh } = getTokens(req);

  if (!refresh) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  let token = access;

  // refresh if needed
  if (!token) {
    const refreshed = await refreshAccess(refresh);
    token = refreshed.access_token;
  }

  // ---------------------------------------------
  // 1 — Get user profile
  // ---------------------------------------------
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const me = await meRes.json();

  // ---------------------------------------------
  // 2 — Create Playlist
  // ---------------------------------------------
  const createRes = await fetch(
    `https://api.spotify.com/v1/users/${me.id}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: "Created with DiscDuel",
        public: false,
      }),
    }
  );

  const playlist = await createRes.json();

  // ---------------------------------------------
  // 3 — Add tracks in order
  // ---------------------------------------------
  const uris = rankedSongs.map((s: any) => `spotify:track:${s.id}`);

  await fetch(
    `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    }
  );

  return NextResponse.json({
    url: playlist.external_urls.spotify,
  });
}
