import { NextRequest } from "next/server";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { q, max_results = 10 } = await req.json();
  const token = process.env.X_API_KEY; // döp gärna till X_BEARER_TOKEN
  if (!token) return new Response("Missing X_API_KEY", { status: 500 });

  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", q);
  url.searchParams.set("max_results", String(max_results));

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
  const data = await r.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" }});
}
