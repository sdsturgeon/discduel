export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-4xl font-bold">DiscDuel</h1>

      <a
        href="/api/auth/login"
        className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
      >
        Log in with Spotify
      </a>
    </main>
  );
}
