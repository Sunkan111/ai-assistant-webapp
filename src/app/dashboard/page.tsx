export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full p-8 space-y-4 text-center">
        <h1 className="text-3xl font-bold">AI Assistant (MVP)</h1>
        <p className="opacity-80">
          Live på Vercel – CI/CD aktivt. Klicka vidare till dashboard för att testa layouten.
        </p>

        <div className="flex items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-lg border hover:bg-black hover:text-white transition"
          >
            Gå till Dashboard
          </a>
          <a
            href="/api/hello"
            className="px-4 py-2 rounded-lg border hover:bg-black hover:text-white transition"
          >
            Testa API
          </a>
        </div>
      </div>
    </main>
  );
}

