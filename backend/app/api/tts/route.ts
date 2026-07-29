import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = process.env.SARVAM_API_KEY;
  if (!key) return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, model: "bulbul:v3", speech_sample_rate: 24000, output_audio_codec: "wav" }),
  });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 });
  return NextResponse.json(await res.json());
}
