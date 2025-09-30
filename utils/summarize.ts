// utils/summarize.ts

// Gör korta, kompakta sammanfattningar som kontext. Håll dem < ~1200 tecken per sektion.

export function summarizeSearch(data: any): string {
  // Serper-format har ofta "organic" array
  const items = data?.organic ?? data?.results ?? [];
  const top = items.slice(0, 3).map((it: any, i: number) => {
    const title = it.title || it.name || "Untitled";
    const link = it.link || it.url || "";
    const snippet = it.snippet || it.description || it.snippet_highlighted_words?.join(" ") || "";
    return `${i + 1}. ${title}\n   ${snippet}\n   ${link}`;
  });
  if (!top.length) return "Sök: Inga resultat.";
  return `Sökresultat (topp 3):\n${top.join("\n")}`;
}

export function summarizeNews(data: any): string {
  const articles = data?.articles || data?.results || [];
  const top = articles.slice(0, 3).map((a: any, i: number) => {
    const title = a.title || a.name || "Untitled";
    const source = a.source?.name ? ` (${a.source.name})` : "";
    const date = a.publishedAt ? ` – ${a.publishedAt}` : "";
    const desc = a.description || a.content || "";
    const url = a.url || "";
    return `${i + 1}. ${title}${source}${date}\n   ${desc}\n   ${url}`;
  });
  if (!top.length) return "Nyheter: Inga artiklar.";
  return `Nyhetsöversikt (topp 3):\n${top.join("\n")}`;
}

export function summarizeMarkets(data: any): string {
  // Hantera både Alpha Vantage och Twelve Data grovt
  // Alpha Vantage TIME_SERIES_INTRADAY: "Time Series (1min)" objekt
  // Twelve Data time_series: { values: [{datetime, open, high, low, close, volume}, ...] }
  let points: { t: string; close: string }[] = [];

  if (data?.values?.length) {
    // Twelve Data
    points = data.values.slice(0, 5).map((v: any) => ({ t: v.datetime, close: v.close }));
  } else {
    // Alpha Vantage
    const key = Object.keys(data || {}).find(k => k.toLowerCase().includes("time series"));
    const series = key ? data[key] : null;
    if (series && typeof series === "object") {
      const entries = Object.entries(series).slice(0, 5) as [string, any][];
      points = entries.map(([ts, v]) => ({ t: ts, close: v["4. close"] || v["4. Close"] || "" }));
    }
  }

  if (!points.length) return "Marknadsdata: Tomt svar.";
  const sample = points.map(p => `• ${p.t}: close=${p.close}`).join("\n");
  return `Marknadsöversikt (senaste punkter):\n${sample}`;
}

// Binder ihop alla sammanfattningar till en enda kompakt kontextsträng
export function buildToolContext(sections: string[]): string {
  const cleaned = sections.filter(Boolean).map(s => s.trim());
  if (!cleaned.length) return "";
  return [
    "Extern kontext (verktyg):",
    cleaned.join("\n\n")
  ].join("\n");
}
