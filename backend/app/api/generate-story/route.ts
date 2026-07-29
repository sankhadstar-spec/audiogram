import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { systemPrompt, userPrompt } = await req.json();
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "Story service not configured" }, { status: 503 });
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.9 }),
  });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 });
  const data = await res.json();
  return NextResponse.json({ text: data.choices[0].message.content.trim() });
}
