"use client";

import { useEffect, useState } from "react";
import ChatControls from "@/components/ChatControls";
import {
  needsWebSearch,
  needsNews,
  needsMarket,
  fetchSearch,
  fetchNews,
  fetchMarkets,
} from "../../utils/toolRouter";
import {
  summarizeSearch,
  summarizeNews,
  summarizeMarkets,
  buildToolContext,
} from "../../utils/summarize";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [assistantText, setAssistantText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const [controls, setControls] = useState({
    model: "gemini-1.5-flash",
    temperature: 0.7,
    autoTools: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("chatHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  async function sendMessage(userText: string) {
    if (!userText.trim()) return;

    setIsLoading(true);
    setAssistantText("");

    const userMsg: Msg = { role: "user", content: userText };

    // 1) Hämta verktygskontext om autoTools
    const toolSections: string[] = [];
    if (controls.autoTools) {
      const jobs: Promise<any>[] = [];

      if (needsWebSearch(userText)) {
        jobs.push(
          fetchSearch(userText, 5)
            .then((data: any) => toolSections.push(summarizeSearch(data)))
            .catch(() => toolSections.push("Sök: (fel vid hämtning)"))
        );
      }
      if (needsNews(userText)) {
        jobs.push(
          fetchNews(userText, "sv", 5)
            .then((data: any) => toolSections.push(summarizeNews(data)))
            .catch(() => toolSections.push("Nyheter: (fel vid hämtning)"))
        );
      }
      if (needsMarket(userText)) {
        const m = userText.match(/\b[A-Z]{1,6}\b/);
        const symbol = m ? m[0] : "AAPL";
        jobs.push(
          fetchMarkets({ provider: "twelve", symbol, interval: "1min" })
            .then((data: any) => toolSections.push(summarizeMarkets(data)))
            .catch(() => toolSections.push("Marknad: (fel vid hämtning)"))
        );
      }

      if (jobs.length) {
        try { await Promise.all(jobs); } catch {}
      }
    }

    const toolContext = buildToolContext(toolSections);
    const outbound: Msg[] = [
      { role: "user", content: "System: Du är en hjälpsam AI-assistent. Om extern kontext finns, använd den, och var tydlig med osäkerheter." },
      ...messages,
      ...(toolContext ? [{ role: "user", content: toolContext } as Msg] : []),
      userMsg,
    ];

    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        model: controls.model,
        temperature: controls.temperature,
        messages: outbound,
      }),
    });

    if (!res.ok || !res.body) {
      setAssistantText("Kunde inte få svar just nu.");
      setIsLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const p of parts) {
        if (!p.startsWith("data: ")) continue;
        const json = p.slice(6);
        if (json === "[DONE]") continue;
        try {
          const obj = JSON.parse(json);
          const delta = obj?.choices?.[0]?.delta?.content ?? "";
          if (delta) setAssistantText((prev) => prev + delta);
        } catch {}
      }
    }

    setMessages((prev) => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (lastIdx >= 0 && copy[lastIdx].role === "assistant") {
        copy[lastIdx] = { role: "assistant", content: assistantText };
      }
      return copy;
    });

    setIsLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col gap-4">
      <ChatControls onChange={setControls} initial={controls} />

      <div className="flex flex-col gap-2 border rounded-xl p-3 min-h-[300px]">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
              {assistantText || "…"}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { sendMessage(input); setInput(""); } }}
          placeholder="Skriv ett meddelande…"
        />
        <button
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
          disabled={isLoading || !input.trim()}
          onClick={() => { sendMessage(input); setInput(""); }}
        >
          Skicka
        </button>
        <button
          className="px-3 py-2 text-sm underline"
          onClick={() => { setMessages([]); localStorage.removeItem("chatHistory"); }}
        >
          Rensa historik
        </button>
      </div>
    </div>
  );
}
