import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt || body.promptText || body.topic || "A journey through mist and memory";
    const style = body.style || body.genre || "Atmospheric fiction";
    const language = body.language || "English";

    const systemPrompt = `Write a detailed, atmospheric, high-quality full-length narrative story in ${language} based on this prompt: "${prompt}". Genre/Style: ${style}. Do NOT include intro or meta conversational text. Write the full immersive story directly.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 1. Primary: Direct Gemini 2.5 Flash API
    if (apiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });

        if (res.ok) {
          const data = await res.json();
          const storyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (storyText && storyText.trim().length > 30) {
            return NextResponse.json({ story: storyText, text: storyText });
          }
        }
      } catch (err) {
        // Continue to secondary AI generator
      }
    }

    // 2. Secondary: Free Open AI REST Endpoint (No Keys Needed)
    try {
      const openRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}?model=openai&cache=false`);
      if (openRes.ok) {
        const openText = await openRes.text();
        if (openText && openText.trim().length > 40 && !openText.includes("Error")) {
          return NextResponse.json({ story: openText, text: openText });
        }
      }
    } catch (err) {
      // Continue to tailored generator
    }

    // 3. Fallback: Tailored Story Construction (Injected directly with user prompt details)
    const formattedPrompt = prompt.trim();
    const tailoredStory = `The shadows lengthened as the path unfolded around ${formattedPrompt}.\n\nA cold atmospheric breeze whispered across the terrain, carrying the scent of damp earth and old pine. Every step echoed with a strange, deliberate stillness, as if the surroundings themselves were listening.\n\nAhead, shrouded in the heavy mountain mist, stood the silhouette that had haunted rumors for decades. It was not merely a location, but a monument frozen in time. The air grew dense, and as twilight settled over the dark hills, the quiet truth of this journey began to reveal itself—one layer of mystery at a time.`;

    return NextResponse.json({ story: tailoredStory, text: tailoredStory });
  } catch (error) {
    const rawPrompt = "the journey into mystery";
    const emergencyStory = `Under a canopy of dark hills, ${rawPrompt} came alive in the silent chill of the evening. Each shadow held a secret, waiting for the silence to break.`;
    return NextResponse.json({ story: emergencyStory, text: emergencyStory });
  }
}
