import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt || body.promptText || "A story set in Kolkata";
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response.text) {
        return NextResponse.json({ story: response.text, text: response.text });
      }
    }

    const fallbackStory = `It began on a quiet evening in Kolkata. ${prompt}.\n\nThe old frequency dial hummed, casting a faint copper glow across the room. Every shadow seemed to hold its breath as atmospheric crackles gave way to a lost transmission.\n\nSome frequencies belong to the past, but tonight, this one felt entirely present.`;

    return NextResponse.json({ story: fallbackStory, text: fallbackStory });
  } catch (error) {
    const defaultStory = "A quiet story in Kolkata where ancient radio waves meet the present.";
    return NextResponse.json({ story: defaultStory, text: defaultStory });
  }
}
