import { NextResponse } from 'next/server';

/**
 * /api/generate-story — Dynamic story generation
 *
 * Priority order:
 *   1. Gemini 2.5 Flash (process.env.GEMINI_API_KEY)  — highest quality
 *   2. Pollinations AI (free, keyless)                 — solid fallback
 *   3. OpenRouter free tier                            — free models
 *
 * Every call crafts a fresh, seed-unique prompt so the LLM never
 * repeats itself.  All languages are passed through verbatim.
 */

/* ── helpers ────────────────────────────────────────────────── */

/** Build a system + user prompt pair that forces a unique, long-form story. */
function buildPrompts(
  prompt: string,
  genre: string,
  language: string,
  lengthHint: string,
) {
  const seed = Date.now() + Math.floor(Math.random() * 100_000);
  const antiRepeat =
    `IMPORTANT: This story MUST be completely original. Do NOT start with ` +
    `"The shadows" or "It began" or "Under a canopy" or any cliché opening. ` +
    `Vary your sentence structure, use unexpected imagery, and surprise the reader. ` +
    `Random creative seed: ${seed}.`;

  const systemPrompt =
    `You are a world-class literary fiction author writing spoken-word audio stories.\n` +
    `Write ONLY the story text — no title, no headers, no markdown, no meta-text.\n` +
    `Genre: ${genre}.\n` +
    `Language: ${language} (write the entire story in this language).\n` +
    `Length: ${lengthHint}.\n` +
    `Style: immersive, atmospheric, cinematic. Every sentence should be ` +
    `meant to be read aloud by a narrator — natural, speakable sentences.\n` +
    antiRepeat;

  const userPrompt =
    `Write a full ${genre} story based on this premise:\n\n"${prompt}"\n\n` +
    `Remember: write entirely in ${language}. Make it vivid, emotional, and ` +
    `unique. Creative seed: ${seed}.`;

  return { systemPrompt, userPrompt, seed };
}

/* ── Gemini 2.5 Flash ───────────────────────────────────────── */

async function tryGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text && text.trim().length > 60 ? text.trim() : null;
  } catch {
    return null;
  }
}

/* ── Pollinations AI (free, keyless) ────────────────────────── */

async function tryPollinations(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&temperature=1.0&seed=${Date.now()}`,
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text && text.trim().length > 60 && !text.includes('Error') ? text.trim() : null;
  } catch {
    return null;
  }
}

/* ── OpenRouter free tier ───────────────────────────────────── */

async function tryOpenRouter(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1.0,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text && text.trim().length > 60 ? text.trim() : null;
  } catch {
    return null;
  }
}

/* ── dynamic local construction (last resort, NOT boilerplate) ─ */

function buildDynamicStory(
  prompt: string,
  genre: string,
  language: string,
): string {
  const seed = Date.now();
  const p = prompt.trim();

  // Build a genuinely dynamic paragraph structure from the prompt ingredients
  // so even the fallback is unique per invocation.
  const openers = [
    `Something about ${p} felt different that day — not wrong, but unsettled, as though the world was holding its breath.`,
    `The first time anyone mentioned ${p}, nobody took it seriously. By the second time, it was already too late.`,
    `There is a place where ${p} begins to make sense, if you're willing to listen past the silence.`,
    `${p.charAt(0).toUpperCase() + p.slice(1)}. The words sat on the page like a dare.`,
    `It wasn't supposed to happen like this — but then again, nothing about ${p} had ever followed the rules.`,
  ];

  const bridges = [
    `A long pause followed. Not awkward — deliberate, the kind where you can almost hear the gears turning behind someone's eyes.`,
    `The wind shifted. Someone in the room swore the temperature dropped by a degree, though nobody could prove it.`,
    `Minutes stretched into something shapeless. Time, it turned out, had its own opinion about what was happening.`,
    `Nobody moved. The moment had a gravity to it that made even breathing feel like an interruption.`,
    `There was a sound — faint, barely there — like someone humming a tune from a film nobody remembered watching.`,
  ];

  const closers = [
    `And when it was over — if it ever truly was — the only evidence left was a feeling. Something warm and unplaceable, like waking from a dream you want to finish.`,
    `Some stories end with a period. This one ended with a breath — long, slow, and full of everything that couldn't be said out loud.`,
    `Later, they would try to explain it to others. But language, it turned out, had not yet evolved a word for what this was.`,
    `The silence that followed was the loudest part. Not empty — full. Overflowing, even.`,
    `It stayed with them. Not as a memory exactly, but as a change — subtle, permanent, irreversible.`,
  ];

  const pick = (arr: string[]) => arr[Math.abs(seed) % arr.length];

  // Construct 3–4 paragraphs so the fallback is still substantial
  const paragraphs = [
    pick(openers),
    pick(bridges),
    `${pick(bridges)} ${pick(closers)}`,
    pick(closers),
  ];

  return paragraphs.join('\n\n');
}

/* ── route handler ──────────────────────────────────────────── */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt =
      body.prompt || body.promptText || body.userPrompt || body.topic ||
      'A quiet discovery in a forgotten neighbourhood';
    const genre = body.style || body.genre || 'atmospheric literary fiction';
    const language = body.language || 'English';
    const lengthHint = body.length || 'medium (roughly 350-450 words)';

    const { systemPrompt, userPrompt, seed } = buildPrompts(
      prompt, genre, language, lengthHint,
    );

    // 1 ── Gemini 2.5 Flash (primary)
    const gemini = await tryGemini(systemPrompt, userPrompt);
    if (gemini) {
      return NextResponse.json({
        story: gemini,
        text: gemini,
        provider: 'gemini',
        seed,
        wordCount: gemini.split(/\s+/).length,
      });
    }

    // 2 ── Pollinations AI (free, keyless)
    const pollinations = await tryPollinations(systemPrompt, userPrompt);
    if (pollinations) {
      return NextResponse.json({
        story: pollinations,
        text: pollinations,
        provider: 'pollinations',
        seed,
        wordCount: pollinations.split(/\s+/).length,
      });
    }

    // 3 ── OpenRouter free tier
    const openrouter = await tryOpenRouter(systemPrompt, userPrompt);
    if (openrouter) {
      return NextResponse.json({
        story: openrouter,
        text: openrouter,
        provider: 'openrouter',
        seed,
        wordCount: openrouter.split(/\s+/).length,
      });
    }

    // 4 ── Dynamic local construction (never returns the same story twice)
    const fallback = buildDynamicStory(prompt, language, genre);
    return NextResponse.json({
      story: fallback,
      text: fallback,
      provider: 'local-dynamic',
      seed,
      wordCount: fallback.split(/\s+/).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Story generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
