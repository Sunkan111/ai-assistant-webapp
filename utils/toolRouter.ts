// utils/toolRouter.ts
type SearchResponse = any;
type NewsResponse = any;
type MarketsResponse = any;

export function needsWebSearch(t: string) {
  return /\b(sök|googla|search|who is|what is|how to|kolla upp|leta)\b/i.test(t);
}

export function needsNews(t: string) {
  return /\b(nyhet|nyheter|news|latest|senaste|rubriker|artiklar)\b/i.test(t);
}

export function needsMarket(t: string) {
  // Trigga när det finns ett tickersymbol-liknande ord + pris/interval
  // t.ex. "AAPL 1min", "TSLA price", "BTC chart"
  const mentionsPrice = /\b(price|kurs|chart|graf|intraday|1min|5min|15min|daily)\b/i.test(t);
  const tickerLike = /\b[A-Z]{1,6}\b/.test(t); // enkel heuristik
  return mentionsPrice && tickerLike;
}

export async function fetchSearch(q: string, num = 5): Promise<SearchResponse> {
  const r = await fetch("/api/search", {
    method: "POST",
    body: JSON.stringify({ q, num }),
  });
  if (!r.ok) throw new Error(`Search failed: ${await r.text()}`);
  return r.json();
}

export async function fetchNews(q: string, lang = "sv", pageSize = 5): Promise<NewsResponse> {
  const r = await fetch("/api/news", {
    method: "POST",
    body: JSON.stringify({ q, lang, pageSize }),
  });
  if (!r.ok) throw new Error(`News failed: ${await r.text()}`);
  return r.json();
}

export async function fetchMarkets(input: { provider?: "alpha" | "twelve"; symbol: string; interval?: string }): Promise<MarketsResponse> {
  const r = await fetch("/api/markets", {
    method: "POST",
    body: JSON.stringify({
      provider: input.provider ?? "twelve",
      symbol: input.symbol,
      interval: input.interval ?? "1min",
    }),
  });
  if (!r.ok) throw new Error(`Markets failed: ${await r.text()}`);
  return r.json();
}
