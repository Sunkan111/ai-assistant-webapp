// src/app/api/news/route.ts
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { q, lang = "en", pageSize = 5 } = await request.json();

    const apiKey = process.env.NEWSAPI_API_KEY;
    if (!apiKey) return new Response("Missing NEWSAPI_API_KEY", { status: 500 });

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=${pageSize}&apiKey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    return Response.json(data);
  } catch (e: unknown) {
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
}
