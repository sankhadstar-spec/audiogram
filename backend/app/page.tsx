// Root page: serves the static feed HTML from the public folder.
// The feed and studio are plain HTML files — Next.js handles routing and the API.
import { redirect } from "next/navigation";

// Redirect / → /feed so the URL is meaningful, or just render a link page.
// Change to redirect("/feed") once you move the HTML into app/feed/page.tsx.
export default function Home() {
  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, padding: 32 }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, margin: 0 }}>🎵 Audigram</h1>
      <p style={{ color: "#999", fontSize: 18, margin: 0, textAlign: "center" }}>
        Audio stories for the next generation of Indian creators.
      </p>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <a href="/feed" style={btnStyle("#1a1a2e")}>Browse Feed</a>
        <a href="/studio" style={btnStyle("#7c3aed")}>Open Studio</a>
      </div>
      <p style={{ color: "#555", fontSize: 13, marginTop: 32, textAlign: "center", maxWidth: 420 }}>
        API: <code style={{ color: "#7c3aed" }}>GET /api/audios</code> · 
        <code style={{ color: "#7c3aed" }}> POST /api/audios</code> · 
        <code style={{ color: "#7c3aed" }}> POST /api/upload</code>
        <br />
        Auth: <code style={{ color: "#7c3aed" }}>/api/auth/signin</code>
      </p>
    </main>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    padding: "12px 28px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 16,
    border: "1px solid #333",
  };
}
