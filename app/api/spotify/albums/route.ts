import { NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const artistId = url.searchParams.get("artistId");

  if (!artistId) {
    return NextResponse.json(
      { error: "Missing artistId" },
      { status: 400 }
    );
  }

  const token = await getSpotifyToken();

  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();
  console.log("SPOTIFY API DATA:", data.items?.[0]);
  // Spotify returns { items: [...] }
  // so we normalize and return the same shape your UI expects.
  return NextResponse.json({
    items: data.items ?? [],
  });
}
