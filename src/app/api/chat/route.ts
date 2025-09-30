import type { Content } from "@google/generative-ai";
// src/app/api/chat/route.ts
export const runtime = "nodejs";



function toGeminiRole(role: string) {
  return role === "assistant" ? "model" : "user";
}

export async function POST(request: Request) {
  // Dynamisk import för Vercel-kompatibilitet
  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import("@google/generative-ai");
  try {
    const { messages, model = "gemini-1.5-pro", temperature = 0.7 } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("Missing GEMINI_API_KEY", { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({ model });

    const contents: Content[] = [];
    for (const m of messages || []) {
      if (!m?.content) continue;
      contents.push({ role: toGeminiRole(m.role), parts: [{ text: String(m.content) }] });
    }

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const generationConfig = { temperature, maxOutputTokens: 2048 };
    const result = await gemini.generateContentStream({ contents, safetySettings, generationConfig });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk?.text() || "";
            if (text) {
              const payload = JSON.stringify({ choices: [{ delta: { content: text } }] });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: any) {
    console.error(e); // Logga felet för felsökning
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
}

