import { NextResponse } from 'next/server';

function createSineWavBuffer(text: string): Uint8Array {
  const sampleRate = 22050;
  const duration = Math.min(Math.max(text.length * 0.08, 1.5), 6.0);
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 220 + Math.sin(t * 8) * 30;
    const sample = Math.floor(Math.sin(2 * Math.PI * freq * t) * 8000);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text || body.prompt || "Audio preview generated successfully.";
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "playai-tts",
          input: text,
          voice: body.voice || "en-US-Neural"
        })
      });

      if (res.ok) {
        const audioArrayBuffer = await res.arrayBuffer();
        return new NextResponse(audioArrayBuffer, {
          headers: { 'Content-Type': 'audio/mpeg' }
        });
      }
    }

    const wavBuffer = createSineWavBuffer(text);
    return new NextResponse(wavBuffer, {
      headers: { 'Content-Type': 'audio/wav' }
    });
  } catch (error) {
    const wavBuffer = createSineWavBuffer("Playback fallback activated.");
    return new NextResponse(wavBuffer, {
      headers: { 'Content-Type': 'audio/wav' }
    });
  }
}
