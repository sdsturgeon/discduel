import { NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const token = await getSpotifyToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    return NextResponse.json(data.artists.items);
  } catch (err) {
    console.error("Spotify Artist Search Error:", err);
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
