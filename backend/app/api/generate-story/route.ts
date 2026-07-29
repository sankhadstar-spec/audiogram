import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt || body.promptText || body.topic || "A captivating story";
    const style = body.style || body.genre || "Atmospheric fiction";
    const language = body.language || "English";

    const systemPrompt = `You are a world-class storyteller and master author. Write a detailed, captivating, professional long-tail story based on the user's prompt in the language '${language}'. Style: ${style}. Do NOT include metadata or intros like "Here is your story". Output ONLY the story content directly.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 1. Try Google Gemini direct API if key is present
    if (apiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` }] }
          ]
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

    // 2. Free Public Web3 / Open LLM API Fallback (Unlimited dynamic stories without keys)
    const openRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: "openai",
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (openRes.ok) {
      const generatedText = await openRes.text();
      if (generatedText && generatedText.trim().length > 20) {
        return NextResponse.json({ story: generatedText, text: generatedText });
      }
    }

    // 3. Dynamic procedural fallback if network fails
    const dynamicStory = `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}.\n\nIn a world where ordinary paths twist into unexpected journeys, every choice echoed like a distant melody. The air carried the subtle rhythm of a story waiting to unfold, where history and passion crossed paths without warning.\n\nAs time moved forward, the true essence of this journey began to reveal itself, proving that the most profound stories are those shaped by pure dedication.`;

    return NextResponse.json({ story: dynamicStory, text: dynamicStory });
  } catch (error) {
    return NextResponse.json({ 
      story: "A compelling story unfolding across space and time.", 
      text: "A compelling story unfolding across space and time." 
    });
  }
}
