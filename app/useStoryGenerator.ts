"use client";

import { useState } from "react";

export function useStoryGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async (promptText: string, genre: string, length: string) => {
    setLoading(true);
    setError(null);

    const fullPrompt = `Write a ${length} story in the ${genre} genre based on this prompt: "${promptText}".`;

    try {
      if (typeof window !== "undefined" && ((window as any).ai?.languageModel || (window as any).LanguageModel)) {
        const aiModel = (window as any).ai?.languageModel || (window as any).LanguageModel;
        const capabilities = await aiModel.availability();

        if (capabilities !== "no") {
          const session = await aiModel.create({
            systemPrompt: "You are a creative narrative writer specializing in immersive atmospheric fiction."
          });
          const result = await session.prompt(fullPrompt);
          session.destroy();
          setLoading(false);
          return result;
        }
      }

      const story = generateFallbackStory(promptText, genre);
      setLoading(false);
      return story;

    } catch (err: any) {
      const fallback = generateFallbackStory(promptText, genre);
      setLoading(false);
      return fallback;
    }
  };

  return { generateStory, loading, error };
}

function generateFallbackStory(prompt: string, genre: string): string {
  const cleanPrompt = prompt.trim() || "An unexpected discovery in Kolkata";

  const intros = [
    `It began on a quiet evening in Kolkata. ${cleanPrompt}.`,
    `The air was heavy with anticipation when ${cleanPrompt.toLowerCase()}.`,
  ];

  const middles = [
    `The old frequency dial hummed, casting a faint copper glow across the room. Every shadow seemed to hold its breath as atmospheric crackles gave way to a lost transmission.`,
    `Moments passed in stillness before a rhythmic, forgotten melody began echoing gently through the space.`,
  ];

  const ends = [
    `Some frequencies belong to the past, but tonight, this one felt entirely present.`,
    `And just like that, the quiet returned, leaving behind a moment frozen in time.`,
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(intros)}\n\n${pick(middles)}\n\n${pick(ends)}`;
}
