"use client";

import { useState, useCallback } from "react";

/**
 * useStoryGenerator — React hook for dynamic story generation.
 *
 * Always calls the server-side /api/generate-story endpoint which
 * has multi-provider fallbacks (Gemini → Pollinations → OpenRouter → dynamic local).
 * No local canned templates — the server guarantees unique output.
 */

export interface StoryResult {
  story: string;
  text: string;
  provider: string;
  seed: number;
  wordCount: number;
}

export function useStoryGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<StoryResult | null>(null);

  const generateStory = useCallback(
    async (
      promptText: string,
      genre: string,
      length: string,
      language: string = "English",
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            genre,
            length,
            language,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Story generation failed (${res.status})`);
        }

        const data: StoryResult = await res.json();
        setLastResult(data);
        setLoading(false);
        return data.text || data.story;
      } catch (err: any) {
        const message = err?.message || "Story generation failed";
        setError(message);
        setLoading(false);
        throw new Error(message);
      }
    },
    [],
  );

  return { generateStory, loading, error, lastResult };
}
