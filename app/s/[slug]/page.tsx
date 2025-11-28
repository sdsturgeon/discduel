"use client";

import { useEffect, useState } from "react";

interface DecodedTrack {
  id: string;
  n: string;      // name
  a: string;      // album
  i: string|null; // image
  r: string[];    // artists
}

function decodeSlug(slug: string): DecodedTrack[] | null {
  try {
    // Add missing padding if needed
    const pad = slug.length % 4;
    const normalized = pad ? slug + "=".repeat(4 - pad) : slug;

    const json = atob(normalized);
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decode slug:", err);
    return null;
  }
}

export default function SharePage({ params }: any) {
  const { slug } = params;

  const [tracks, setTracks] = useState<DecodedTrack[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const decoded = decodeSlug(slug);
    setTracks(decoded);
  }, [slug]);

  if (!tracks) {
    return (
      <div className="text-white p-10 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Invalid Link</h1>
        <p className="text-gray-400">
          This DiscDuel link is corrupted or incomplete.
        </p>
      </div>
    );
  }

  return (
    <div className="text-white p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-spotify-green">
        Ranking Results
      </h1>

      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="bg-gray-700 px-4 py-2 rounded font-bold mb-6 cursor-pointer"
      >
        {copied ? "Copied!" : "Copy Share Link"}
      </button>

      <ol className="space-y-4 mb-8">
        {tracks.map((song, idx) => (
          <li key={song.id} className="flex items-center gap-4">
            {song.i && (
              <img
                src={song.i}
                className="w-12 h-12 rounded object-cover"
                alt={song.a}
              />
            )}
            <span className="text-xl">
              <b>{idx + 1}.</b> {song.n}{" "}
              <span className="text-gray-400">({song.a})</span>
            </span>
          </li>
        ))}
      </ol>

      <a
        href="/"
        className="bg-spotify-green text-black px-5 py-3 rounded font-bold cursor-pointer inline-block"
      >
        Make Your Own Ranking →
      </a>
    </div>
  );
}
