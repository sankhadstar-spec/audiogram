import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt || body.promptText || "A story set in Kolkata";
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return NextResponse.json({ story: text, text });
        }
      }
    }

    const fallbackStory = `It began on a quiet evening in Kolkata. ${prompt}.\n\nThe old frequency dial hummed, casting a faint copper glow across the room. Every shadow seemed to hold its breath as atmospheric crackles gave way to a lost transmission.\n\nSome frequencies belong to the past, but tonight, this one felt entirely present.`;

    return NextResponse.json({ story: fallbackStory, text: fallbackStory });
  } catch (error) {
    const defaultStory = "A quiet story in Kolkata where ancient radio waves meet the present.";
    return NextResponse.json({ story: defaultStory, text: defaultStory });
  }
}
