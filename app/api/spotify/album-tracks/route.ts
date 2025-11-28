import { NextResponse } from "next/server";

/** Refresh Spotify access_token using refresh_token */
async function refreshAccessToken(refreshToken: string) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("id");

  if (!albumId) {
    return NextResponse.json({ error: "Missing album ID" }, { status: 400 });
  }

  // Grab tokens from cookies
  const accessToken =
    request.headers.get("cookie")?.match(/spotify_access_token=([^;]+)/)?.[1] ||
    null;

  const refreshToken =
    request.headers.get("cookie")?.match(/spotify_refresh_token=([^;]+)/)?.[1] ||
    null;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Refresh access token if expired
  let tokenToUse = accessToken;
  if (!tokenToUse) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (!refreshed.access_token) {
      return NextResponse.json(
        { error: "Failed to refresh token" },
        { status: 500 }
      );
    }
    tokenToUse = refreshed.access_token;
  }

  // --- Fetch tracks for album ---
  const tracksRes = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
    {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    }
  );

  if (!tracksRes.ok) {
    return NextResponse.json(
      { error: "Spotify track fetch failed" },
      { status: 500 }
    );
  }

  const tracksData = await tracksRes.json();

  // --- Fetch album metadata (name + cover) ---
  const albumRes = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    }
  );

  const albumData = await albumRes.json();

  const albumName = albumData.name;
  const albumImage = albumData.images?.[0]?.url ?? null;

  // --- Merge album + artists into each track ---
  const enrichedTracks = tracksData.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    preview_url: track.preview_url,
    albumName,
    albumImage,
    artists: track.artists?.map((a: any) => a.name) ?? [],  // <-- ADDED THIS
  }));

  return NextResponse.json({ items: enrichedTracks });
}
