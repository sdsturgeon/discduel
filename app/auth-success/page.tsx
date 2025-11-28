export default function AuthSuccess() {
  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-3xl font-bold">Logged in successfully!</h1>
      <p className="text-lg">You can now search for artists and choose albums.</p>

      <a
        href="/select-artist"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
      >
        Continue
      </a>
    </main>
  );
}
