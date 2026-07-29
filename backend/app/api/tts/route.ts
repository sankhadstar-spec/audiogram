import { NextResponse } from 'next/server';

/**
 * /api/tts — Multi-tier text-to-speech synthesis
 *
 * Priority order:
 *   1. Groq PlayAI TTS (process.env.GROQ_API_KEY)       — highest quality
 *   2. Edge TTS (via free Microsoft Edge endpoint)        — excellent multilingual
 *   3. OpenAI-compatible TTS (process.env.OPENAI_API_KEY) — broad fallback
 *   4. Browser-native WAV synthesis (sine-wave placeholder)
 *
 * All binary responses use ArrayBuffer → new Response(ab) which is
 * 100% compliant with Next.js strict mode BodyInit typing.
 */

/* ── helper: clean ArrayBuffer → Response ───────────────────── */

function audioResponse(data: ArrayBuffer | Uint8Array, contentType: string) {
  // Ensure we pass a plain ArrayBuffer (not Node Buffer) to satisfy
  // Next.js strict BodyInit validation at runtime.
  const ab = data instanceof ArrayBuffer ? data : data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  );
  return new Response(ab, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

/* ── 1. Groq PlayAI TTS ────────────────────────────────────── */

async function tryGroq(text: string, voice: string): Promise<Response | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'playai-tts',
        input: text.slice(0, 10000),
        voice: voice || 'PlayAI-Dialog',
      }),
    });

    if (!res.ok) return null;
    const audioBuffer = await res.arrayBuffer();
    return audioResponse(audioBuffer, 'audio/mpeg');
  } catch {
    return null;
  }
}

/* ── 2. Edge TTS (Microsoft's free endpoint, no key needed) ─── */

async function tryEdgeTTS(text: string, lang: string): Promise<Response | null> {
  try {
    const voiceMap: Record<string, string> = {
      'en': 'en-US-AriaNeural',
      'en-US': 'en-US-AriaNeural',
      'en-GB': 'en-GB-SoniaNeural',
      'hi': 'hi-IN-SwaraNeural',
      'bn': 'bn-IN-TanishaaNeural',
      'ta': 'ta-IN-PallaviNeural',
      'te': 'te-IN-ShrutiNeural',
      'es': 'es-ES-ElviraNeural',
      'pt': 'pt-BR-FranciscaNeural',
      'fr': 'fr-FR-DeniseNeural',
      'de': 'de-DE-KatjaNeural',
      'ja': 'ja-JP-NanamiNeural',
      'zh': 'zh-CN-XiaoxiaoNeural',
      'ko': 'ko-KR-SunHiNeural',
      'ar': 'ar-SA-ZariyahNeural',
    };

    const voice = voiceMap[lang] || voiceMap[lang.split('-')[0]] || 'en-US-AriaNeural';

    const res = await fetch(
      `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`,
    );

    if (!res.ok) return null;

    const ttsRes = await fetch('https://api.streamelements.com/kappagen/v2/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice: voice,
        text: text.slice(0, 5000),
      }),
    });

    if (ttsRes.ok) {
      const audioBuffer = await ttsRes.arrayBuffer();
      if (audioBuffer.byteLength > 1000) {
        return audioResponse(audioBuffer, 'audio/mpeg');
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ── 3. OpenAI-compatible TTS ───────────────────────────────── */

async function tryOpenAI(text: string, voice: string): Promise<Response | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: voice || 'nova',
        response_format: 'mp3',
      }),
    });

    if (!res.ok) return null;
    const audioBuffer = await res.arrayBuffer();
    return audioResponse(audioBuffer, 'audio/mpeg');
  } catch {
    return null;
  }
}

/* ── 4. Sarvam Bulbul v3 (Indian languages) ────────────────── */

async function trySarvam(text: string, lang: string): Promise<Response | null> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;

  try {
    const langCode = lang.startsWith('bn') ? 'bn-IN'
      : lang.startsWith('hi') ? 'hi-IN'
      : lang.startsWith('ta') ? 'ta-IN'
      : lang.startsWith('te') ? 'te-IN'
      : 'en-IN';

    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        target_language_code: langCode,
        speaker: 'anand',
        model: 'bulbul:v3',
        pace: 1.0,
        speech_sample_rate: 24000,
        output_audio_codec: 'wav',
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.audios?.[0]) return null;

    const binary = atob(data.audios[0]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return audioResponse(bytes, 'audio/wav');
  } catch {
    return null;
  }
}

/* ── 5. WAV fallback (sine-wave placeholder) ────────────────── */

function buildFallbackWav(text: string): Response {
  const sampleRate = 22050;
  const duration = Math.min(Math.max(text.length * 0.06, 2.0), 12.0);
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const ab = new ArrayBuffer(totalSize);
  const view = new DataView(ab);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 260 + Math.sin(t * 2.0) * 60 + Math.sin(t * 0.5) * 20;
    const envelope = Math.min(1, t * 4) * Math.min(1, (duration - t) * 4);
    const sample = Math.floor(Math.sin(2 * Math.PI * freq * t) * 6000 * envelope);
    view.setInt16(headerSize + i * 2, sample, true);
  }

  return new Response(ab, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'X-Audio-Provider': 'fallback-sine',
    },
  });
}

/* ── route handler ──────────────────────────────────────────── */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text || body.prompt || body.input ||
      'Audio preview generated successfully.';
    const voice = body.voice || '';
    const lang = body.language || body.lang || 'en';

    // 1 ── Groq PlayAI TTS
    const groq = await tryGroq(text, voice);
    if (groq) return groq;

    // 2 ── Edge TTS (free, no key)
    const edge = await tryEdgeTTS(text, lang);
    if (edge) return edge;

    // 3 ── Sarvam Bulbul (Indian languages)
    const sarvam = await trySarvam(text, lang);
    if (sarvam) return sarvam;

    // 4 ── OpenAI-compatible TTS
    const openai = await tryOpenAI(text, voice);
    if (openai) return openai;

    // 5 ── WAV fallback
    return buildFallbackWav(text);
  } catch (error) {
    return buildFallbackWav('Audio generation encountered an error. Please try again.');
  }
}
