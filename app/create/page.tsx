"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3;
const VOICES = [
  { id: "Arista-PlayAI", label: "Arista — warm female" },
  { id: "Atlas-PlayAI", label: "Atlas — deep male" },
  { id: "Basil-PlayAI", label: "Basil — calm narrator" },
  { id: "Briggs-PlayAI", label: "Briggs — storyteller" },
  { id: "Calum-PlayAI", label: "Calum — clear male" },
  { id: "Celeste-PlayAI", label: "Celeste — expressive female" },
  { id: "Deedee-PlayAI", label: "Deedee — bright female" },
  { id: "Fritz-PlayAI", label: "Fritz — authoritative" },
  { id: "Gail-PlayAI", label: "Gail — gentle female" },
  { id: "Mamaw-PlayAI", label: "Mamaw — warm elder" },
];
const GENRES = ["Atmospheric fiction", "Folk tale", "Horror / suspense", "Children's story", "Motivational", "True-crime narration", "Romance", "Mythology"];
const LENGTHS = [
  { value: "short (150-200 words)", label: "Short (~2 min)" },
  { value: "medium (350-450 words)", label: "Medium (~5 min)" },
  { value: "long (700-900 words)", label: "Long (~10 min)" },
];

export default function CreatePage() {
  const [step, setStep] = useState<Step>(1);
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Atmospheric fiction");
  const [length, setLength] = useState("medium (350-450 words)");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // voice
  const [voiceTab, setVoiceTab] = useState<"mic" | "ai">("mic");
  const [voice, setVoice] = useState("Arista-PlayAI");
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [ttsLoading, setTtsLoading] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // publish
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(false);
  const [pubLoading, setPubLoading] = useState(false);

  const generateStory = useCallback(async () => {
    if (!prompt.trim()) { setErr("Write a story idea first."); return; }
    setLoading(true); setErr(""); setStory("");
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: genre, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setStory(data.story || data.text);
      setStep(2);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [prompt, genre, length]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { setErr("Microphone access denied."); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const generateAIVoice = async () => {
    if (!story.trim()) { setErr("Generate a story first."); return; }
    setTtsLoading(true); setErr("");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: story, voice }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const blob = await res.blob();
      setAudioURL(URL.createObjectURL(blob));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setTtsLoading(false);
    }
  };

  const publish = async () => {
    if (!title.trim()) { setErr("Add a title."); return; }
    if (!audioURL) { setErr("Record or generate voice first."); return; }
    setPubLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 1200));
    setPublished(true);
    setPubLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>AUDI<span style={{ color: "#e8622a" }}>GRAM</span></Link>
        <div style={{ display: "flex", gap: 32 }}>
          {(["1 Story", "2 Voice", "3 Publish"] as const).map((s, i) => (
            <span key={s} style={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? "#e8622a" : "#555", cursor: "pointer" }} onClick={() => i < step && setStep((i + 1) as Step)}>
              {s}
            </span>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: 720, margin: "0 auto", padding: "60px 24px", width: "100%" }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <p style={eyebrow}>CREATE AN AUDIGRAM</p>
            <h1 style={headline}>Your voice, a story<br />worth hearing.</h1>
            <p style={sub}>Write with a live AI collaborator, record in your own voice, then publish straight to the same feed.</p>

            <label style={label}>What should the story be about?</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="A boy in Kolkata discovers his grandfather's old radio still picks up a station that stopped broadcasting decades ago."
              style={textarea}
              rows={4}
            />

            <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
              <select value={genre} onChange={e => setGenre(e.target.value)} style={select}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
              <select value={length} onChange={e => setLength(e.target.value)} style={select}>
                {LENGTHS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            {err && <p style={errStyle}>{err}</p>}

            <button onClick={generateStory} disabled={loading} style={primaryBtn}>
              {loading ? "Writing your story…" : "Generate story"}
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <p style={eyebrow}>STEP 2 OF 3</p>
            <h2 style={{ ...headline, fontSize: "clamp(28px, 4vw, 44px)" }}>Give it a voice.</h2>

            <div style={{ background: "#141416", border: "1px solid #222", borderRadius: 10, padding: 20, marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: "#e8622a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Your story</p>
              <textarea
                value={story}
                onChange={e => setStory(e.target.value)}
                style={{ ...textarea, marginBottom: 0, minHeight: 160, fontSize: 14, color: "#c8c4be" }}
              />
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 24, border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
              {(["mic", "ai"] as const).map(t => (
                <button key={t} onClick={() => setVoiceTab(t)} style={{ flex: 1, padding: "12px", background: voiceTab === t ? "#1c1c20" : "transparent", color: voiceTab === t ? "#f0ede8" : "#666", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  {t === "mic" ? "● Record my voice" : "✦ AI voice"}
                </button>
              ))}
            </div>

            {voiceTab === "mic" && (
              <div>
                <p style={{ color: "#9e9a94", fontSize: 14, marginBottom: 20 }}>Read the story above into your mic.</p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {!recording
                    ? <button onClick={startRecording} style={primaryBtn}>● Start recording</button>
                    : <button onClick={stopRecording} style={{ ...primaryBtn, background: "#c0392b" }}>■ Stop recording</button>
                  }
                  {recording && <span style={{ color: "#e8622a", fontSize: 13 }}>● Recording…</span>}
                </div>
              </div>
            )}

            {voiceTab === "ai" && (
              <div>
                <label style={label}>Voice</label>
                <select value={voice} onChange={e => setVoice(e.target.value)} style={{ ...select, marginBottom: 20 }}>
                  {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
                <button onClick={generateAIVoice} disabled={ttsLoading} style={primaryBtn}>
                  {ttsLoading ? "Generating voice…" : "Generate narration"}
                </button>
              </div>
            )}

            {audioURL && (
              <div style={{ marginTop: 28, background: "#141416", border: "1px solid #2a2a2a", borderRadius: 10, padding: 20 }}>
                <p style={{ fontSize: 12, color: "#6e6b66", marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>Preview</p>
                <audio src={audioURL} controls style={{ width: "100%", accentColor: "#e8622a" }} />
                <button onClick={() => setStep(3)} style={{ ...primaryBtn, marginTop: 16 }}>Sounds good → Publish</button>
              </div>
            )}

            {err && <p style={{ ...errStyle, marginTop: 16 }}>{err}</p>}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && !published && (
          <div>
            <p style={eyebrow}>STEP 3 OF 3</p>
            <h2 style={{ ...headline, fontSize: "clamp(28px, 4vw, 44px)" }}>Publish to the feed.</h2>

            {audioURL && <audio src={audioURL} controls style={{ width: "100%", marginBottom: 28, accentColor: "#e8622a" }} />}

            <label style={label}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="The Radio That Never Stopped"
              style={{ ...textarea, padding: "14px 16px", height: "auto", borderRadius: 8, marginBottom: 24 }}
            />

            <label style={label}>Story preview</label>
            <textarea value={story.slice(0, 300) + "…"} readOnly style={{ ...textarea, color: "#666", marginBottom: 28 }} rows={3} />

            {err && <p style={errStyle}>{err}</p>}

            <button onClick={publish} disabled={pubLoading} style={primaryBtn}>
              {pubLoading ? "Publishing…" : "Publish to Audigram"}
            </button>
          </div>
        )}

        {published && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎙️</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, marginBottom: 16 }}>Published!</h2>
            <p style={{ color: "#9e9a94", marginBottom: 36 }}>"{title}" is now live on Audigram.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link href="/feed.html" style={{ ...primaryBtn, textDecoration: "none", display: "inline-block" }}>Browse feed</Link>
              <button onClick={() => { setStep(1); setPrompt(""); setStory(""); setAudioURL(""); setTitle(""); setPublished(false); }} style={{ ...primaryBtn, background: "transparent", border: "1px solid #333", color: "#f0ede8" }}>
                Create another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid #1a1a1a", background: "#0c0c0e", position: "sticky", top: 0, zIndex: 100 };
const logoStyle: React.CSSProperties = { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, letterSpacing: 2, textDecoration: "none", color: "#f0ede8" };
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: 3, color: "#e8622a", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 };
const headline: React.CSSProperties = { fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px" };
const sub: React.CSSProperties = { color: "#9e9a94", fontSize: 16, lineHeight: 1.7, marginBottom: 40 };
const label: React.CSSProperties = { display: "block", fontSize: 13, color: "#9e9a94", marginBottom: 8, fontWeight: 500 };
const textarea: React.CSSProperties = { width: "100%", background: "#141416", border: "1px solid #2a2a2a", borderRadius: 8, color: "#f0ede8", fontSize: 15, padding: "14px 16px", marginBottom: 16, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif", minHeight: 100 };
const select: React.CSSProperties = { flex: 1, background: "#141416", border: "1px solid #2a2a2a", borderRadius: 8, color: "#f0ede8", fontSize: 14, padding: "12px 14px", outline: "none", fontFamily: "Inter, sans-serif" };
const primaryBtn: React.CSSProperties = { background: "#e8622a", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" };
const errStyle: React.CSSProperties = { color: "#e8622a", fontSize: 13, fontFamily: "monospace" };
