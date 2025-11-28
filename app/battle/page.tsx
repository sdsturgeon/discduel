"use client";

import { useEffect, useState, useRef } from "react";
import { calculateElo } from "@/lib/elo";

// ---------- Types ----------
interface Song {
  id: string;
  name: string;
  album: string;
  image: string | null;
  preview_url: string | null;
  artists?: string[];
  elo: number;
}

// ---------- Browser-safe base64 encoder ----------
function encodeShareSlug(ranked: Song[]) {
  const payload = ranked.map((s) => ({
    id: s.id,
    n: s.name,
    a: s.album,
    i: s.image,
    r: s.artists ?? [],
  }));

  const json = JSON.stringify(payload);
  const b64 = btoa(json).replace(/=+$/, ""); // no padding
  return b64;
}

export default function BattlePage({ searchParams }: any) {
  const { albums } = searchParams;
  const albumIds = albums.split(",");

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [pair, setPair] = useState<[Song, Song] | null>(null);

  const [voteCount, setVoteCount] = useState(0);
  const [voteTarget, setVoteTarget] = useState(0);
  const [finished, setFinished] = useState(false);

  const [shareLink, setShareLink] = useState<string | null>(null);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cooldown tracking
  const recentPairs = useRef<Set<string>>(new Set());
  const recentSongs = useRef<string[]>([]);
  const MAX_RECENT_PAIRS = 25;
  const SONG_COOLDOWN = 3;

  // --------------------------------------------------
  // Load songs ONCE
  // --------------------------------------------------
  useEffect(() => {
    async function loadSongs() {
      const allSongs: Song[] = [];

      for (const id of albumIds) {
        const res = await fetch(
          `/api/spotify/album-tracks?id=${encodeURIComponent(id)}`
        );
        const data = await res.json();
        if (!data.items) continue;

        data.items.forEach((track: any) => {
          allSongs.push({
            id: track.id,
            name: track.name,
            album: track.albumName,
            image: track.albumImage,
            preview_url: track.preview_url,
            artists: track.artists ?? [],
            elo: 1000,
          });
        });
      }

      setSongs(allSongs);
      setVoteTarget(allSongs.length * 4);
      setLoading(false);
      setPair(pickNextPair(allSongs));
    }

    loadSongs();
  }, []);

  // --------------------------------------------------
  // Select next pair with cooldown
  // --------------------------------------------------
  function pickNextPair(list: Song[]): [Song, Song] {
    let attempts = 0;

    while (attempts < 200) {
      attempts++;
      const i = Math.floor(Math.random() * list.length);
      const j = Math.floor(Math.random() * list.length);
      if (i === j) continue;

      const A = list[i];
      const B = list[j];

      const pairKey = [A.id, B.id].sort().join("-");

      if (recentPairs.current.has(pairKey)) continue;

      if (
        recentSongs.current.slice(-SONG_COOLDOWN).includes(A.id) ||
        recentSongs.current.slice(-SONG_COOLDOWN).includes(B.id)
      )
        continue;

      recentPairs.current.add(pairKey);
      if (recentPairs.current.size > MAX_RECENT_PAIRS) {
        const firstKey = recentPairs.current.values().next().value;
        recentPairs.current.delete(firstKey);
      }

      recentSongs.current.push(A.id, B.id);
      if (recentSongs.current.length > SONG_COOLDOWN * 10) {
        recentSongs.current = recentSongs.current.slice(-SONG_COOLDOWN * 10);
      }

      return [A, B];
    }

    const i = Math.floor(Math.random() * list.length);
    let j = Math.floor(Math.random() * list.length);
    while (j === i) j = Math.floor(Math.random() * list.length);
    return [list[i], list[j]];
  }

  // --------------------------------------------------
  // Vote action
  // --------------------------------------------------
  function vote(winner: Song, loser: Song) {
    if (finished) return;

    const result = calculateElo(winner.elo, loser.elo);
    const updated = songs.map((s) => {
      if (s.id === winner.id) return { ...s, elo: result.winner };
      if (s.id === loser.id) return { ...s, elo: result.loser };
      return s;
    });

    setSongs(updated);

    const next = voteCount + 1;
    setVoteCount(next);

    if (next >= voteTarget) {
      const ranked = [...updated].sort((a, b) => b.elo - a.elo);
      const slug = encodeShareSlug(ranked);
      setShareLink(`${window.location.origin}/s/${slug}`);
      setFinished(true);
      return;
    }

    setPair(pickNextPair(updated));
  }

  // --------------------------------------------------
  // Export playlist to Spotify
  // --------------------------------------------------
  async function exportPlaylist() {
    if (!finished) return;
    const ranked = [...songs].sort((a, b) => b.elo - a.elo);

    // Get artist name from the top-ranked song
    const artistName =
      ranked[0].artists?.[0] ?? "DiscDuel";

    setCreatingPlaylist(true);

    const res = await fetch("/api/spotify/create-playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rankedSongs: ranked,
        playlistName: `${artistName} DiscDuel Ranking`,
      }),
    });

    const data = await res.json();
    setCreatingPlaylist(false);

    if (data.url) {
      window.open(data.url, "_blank");
    }
  }

  // --------------------------------------------------
  // Finished Screen
  // --------------------------------------------------
  if (finished) {
    const ranked = [...songs].sort((a, b) => b.elo - a.elo);

    return (
      <div className="text-white p-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-spotify-green">
          Your Ranking
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={exportPlaylist}
            disabled={creatingPlaylist}
            className="bg-spotify-green text-black px-4 py-2 rounded font-bold cursor-pointer"
          >
            {creatingPlaylist ? "Creating…" : "Export Playlist to Spotify"}
          </button>

          {shareLink && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="bg-gray-700 px-4 py-2 rounded font-bold cursor-pointer"
            >
              {copied ? "Copied!" : "Copy Share Link"}
            </button>
          )}
        </div>

        <ol className="space-y-4">
          {ranked.map((song, idx) => (
            <li key={song.id} className="flex items-center gap-4">
              {song.image && (
                <img
                  src={song.image}
                  className="w-12 h-12 rounded object-cover"
                  alt={song.album}
                />
              )}
              <span className="text-xl">
                <b>{idx + 1}.</b> {song.name}{" "}
                <span className="text-gray-400">({song.album})</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loading || !pair) {
    return <p className="text-white p-8">Loading songs…</p>;
  }

  const [left, right] = pair;

  // --------------------------------------------------
  // Battle UI
  // --------------------------------------------------
  return (
    <div className="text-white p-10 max-w-6xl mx-auto">
      <p className="text-center text-gray-400 mb-2">
        Vote {voteCount}/{voteTarget}
      </p>

      <h1 className="text-4xl font-bold mb-8 text-spotify-green">Song Battle</h1>

      <div className="grid grid-cols-2 gap-10">
        <div
          onClick={() => vote(left, right)}
          className="p-6 bg-gray-900 rounded-lg cursor-pointer hover:ring-4 hover:ring-spotify-green transition"
        >
          {left.image && (
            <img
              src={left.image}
              className="rounded mb-4 w-full"
            />
          )}
          <h2 className="text-2xl font-semibold">{left.name}</h2>
          <p className="text-gray-400">{left.album}</p>
        </div>

        <div
          onClick={() => vote(right, left)}
          className="p-6 bg-gray-900 rounded-lg cursor-pointer hover:ring-4 hover:ring-spotify-green transition"
        >
          {right.image && (
            <img
              src={right.image}
              className="rounded mb-4 w-full"
            />
          )}
          <h2 className="text-2xl font-semibold">{right.name}</h2>
          <p className="text-gray-400">{right.album}</p>
        </div>
      </div>

      <p className="mt-10 text-center text-gray-500">
        {songs.length} songs loaded — ELO ranking in progress
      </p>
    </div>
  );
}
