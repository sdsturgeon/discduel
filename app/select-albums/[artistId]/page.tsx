"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Album {
  id: string;
  name: string;
  images: { url: string }[];
}

export default function SelectAlbumsPage({
  searchParams,
  params
}: {
  searchParams: { name?: string };
  params: { artistId: string };
}) {
  const artistId = params.artistId;
  const artistName = searchParams.name || "Artist";

  const [albums, setAlbums] = useState<Album[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load albums for this artist
  useEffect(() => {
    async function getAlbums() {
      const res = await fetch(`/api/spotify/albums?artistId=${artistId}`);
      const data = await res.json();
      setAlbums(data.items || []);
      setLoading(false);
    }

    getAlbums();
  }, [artistId]);

  // Toggle selection (no max limit)
  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  // Continue → pass all album IDs to next page
  function continueNext() {
    if (selected.length === 0) return;

    const url = `/battle?artist=${encodeURIComponent(
      artistName
    )}&albums=${selected.join(",")}`;

    window.location.href = url;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-spotify-green">Select Albums</h1>
      <p className="mb-4 text-gray-300">{artistName}</p>

      {loading && <p className="text-gray-400">Loading albums...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {albums.map((album) => {
          const isSelected = selected.includes(album.id);

          return (
            <div
              key={album.id}
              onClick={() => toggleSelect(album.id)}
              className={`p-3 rounded-lg cursor-pointer border transition transform hover:scale-105
                ${
                  isSelected
                    ? "border-spotify-green bg-spotify-green/20 shadow-md"
                    : "border-gray-700 bg-gray-900"
                }`}
            >
              <Image
                src={album.images?.[0]?.url || "/default-album.png"}
                width={300}
                height={300}
                alt={album.name}
                className="rounded mb-2"
              />
              <p className="font-medium text-sm text-white">{album.name}</p>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <button
        disabled={selected.length === 0}
        onClick={continueNext}
        className={`mt-8 w-full py-3 rounded text-white font-semibold
          ${
            selected.length > 0
              ? "bg-spotify-green hover:bg-green-500"
              : "bg-gray-500 cursor-not-allowed"
          }
        `}
      >
        Continue ({selected.length} selected)
      </button>
    </div>
  );
}
