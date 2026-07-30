import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = body.prompt || body.promptText || "A journey through mist and memory";
  const style = body.style || body.genre || "Atmospheric fiction";
  const language = body.language || "English";
  const length = body.length || "medium (350-450 words)";

  const systemPrompt = `Write a ${length} immersive narrative story in ${language} in the style of ${style}. Prompt: "${prompt}". Write the full story directly, no meta commentary, no titles, just pure narrative.`;

  // Primary: Gemini 2.5 Flash
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 50) {
          return NextResponse.json({ story: text.trim(), text: text.trim() });
        }
      }
    } catch {}
  }

  // Fallback: Groq llama
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: systemPrompt }],
          temperature: 0.9,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices[0].message.content.trim();
        return NextResponse.json({ story: text, text });
      }
    } catch {}
  }

  return NextResponse.json({ error: "Story generation not configured" }, { status: 503 });
}
