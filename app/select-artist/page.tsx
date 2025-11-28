"use client";

import { useState } from "react";

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
}

export default function SelectArtistPage() {
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return;

    setLoading(true);

    const res = await fetch(`/api/spotify/search-artist?q=${query}`);
    const data = await res.json();

    // ★★★ FIX IS HERE ★★★
    setArtists(data || []);

    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Select an Artist</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search for an artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={search}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="grid gap-4">
        {artists.map((artist) => (
          <a
            key={artist.id}
            href={`/select-albums/${artist.id}`}
            className="flex items-center gap-4 p-3 border rounded hover:bg-gray-100 transition"
          >
            <img
              src={artist.images?.[0]?.url || "/default-artist.png"}
              className="w-16 h-16 rounded object-cover"
            />
            <p className="text-lg">{artist.name}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
