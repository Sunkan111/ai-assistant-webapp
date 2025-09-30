// src/app/api/markets/route.ts
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { provider = "twelve", symbol = "AAPL", interval = "1min" } = await request.json();

    let url: string | null = null;

    if (provider === "alpha") {
      const key = process.env.ALPHA_VANTAGE_API_KEY;
      if (!key) return new Response("Missing ALPHA_VANTAGE_API_KEY", { status: 500 });
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(
        symbol
      )}&interval=${encodeURIComponent(interval)}&apikey=${encodeURIComponent(key)}`;
    } else if (provider === "twelve") {
      const key = process.env.TWELVE_DATA_API_KEY;
      if (!key) return new Response("Missing TWELVE_DATA_API_KEY", { status: 500 });
      url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
        symbol
      )}&interval=${encodeURIComponent(interval)}&apikey=${encodeURIComponent(key)}`;
    } else {
      return new Response("Invalid provider", { status: 400 });
    }

    const res = await fetch(url);
    const data = await res.json();
    return Response.json(data);
  } catch (e: unknown) {
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
}
