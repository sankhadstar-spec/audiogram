import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = body.text || body.prompt || "Hello from Audigram.";
  const voice = body.voice || "Arista-PlayAI";

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "playai-tts", input: text.slice(0, 4000), voice, response_format: "wav" }),
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, { headers: { "Content-Type": "audio/wav" } });
      }
    } catch {}
  }

  return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
}
