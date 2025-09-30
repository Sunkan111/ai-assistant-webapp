// src/app/api/search/route.ts
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { q, num = 5 } = await request.json();

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return new Response("Missing SERPER_API_KEY", { status: 500 });

    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q, num }),
    });

    const data = await res.json();
    return Response.json(data);
  } catch (e: unknown) {
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
}
