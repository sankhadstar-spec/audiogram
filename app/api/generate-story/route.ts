import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt || body.promptText || "An unexpected discovery in Kolkata";
    
    const story = `It began on a quiet evening in Kolkata. ${prompt}.\n\nThe old frequency dial hummed, casting a faint copper glow across the room. Every shadow seemed to hold its breath as atmospheric crackles gave way to a lost transmission.\n\nSome frequencies belong to the past, but tonight, this one felt entirely present.`;

    return NextResponse.json({ story, text: story });
  } catch (err) {
    return NextResponse.json({ 
      story: "A quiet moment in Kolkata where ancient radio waves meet the present." 
    });
  }
}
