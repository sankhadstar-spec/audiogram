"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const STORIES = [
  "A boy in Kolkata discovers his grandfather's radio still picks up a station that stopped broadcasting decades ago.",
  "A classical singer loses her voice the night before her biggest performance — and finds it somewhere unexpected.",
  "Two strangers share a train compartment from Howrah to Mumbai, each carrying a secret the other needs to hear.",
  "A folk tale collector in rural Bengal records a story from an old woman — and hears her own future in it.",
];

export default function Home() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % STORIES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={nav}>
        <span style={logo}>AUDI<span style={{ color: "#e8622a" }}>GRAM</span></span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/" style={navLink}>Home</Link>
          <Link href="/create" style={{ ...navLink, background: "#e8622a", color: "#fff", padding: "8px 20px", borderRadius: 6, textDecoration: "none" }}>Create</Link>
        </div>
      </nav>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 60px", textAlign: "center" }}>
        <p style={{ fontSize: 13, letterSpacing: 3, color: "#e8622a", textTransform: "uppercase", marginBottom: 24, fontWeight: 600 }}>Audio stories for India</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 7vw, 88px)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 32px", maxWidth: 800 }}>
          Your voice,<br />a story worth<br />hearing.
        </h1>
        <p style={{ fontSize: 16, color: "#9e9a94", maxWidth: 480, lineHeight: 1.7, marginBottom: 48 }}>
          Write with a live AI collaborator, record in your own voice,<br />then publish straight to the same feed.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 80 }}>
          <Link href="/create" style={{ background: "#e8622a", color: "#fff", padding: "14px 36px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>
            Start creating
          </Link>
          <Link href="/feed.html" style={{ background: "transparent", color: "#f0ede8", padding: "14px 36px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 600, border: "1px solid #333" }}>
            Browse feed
          </Link>
        </div>

        <div style={{ maxWidth: 560, background: "#141416", border: "1px solid #222", borderRadius: 12, padding: "24px 28px", textAlign: "left" }}>
          <p style={{ fontSize: 12, color: "#e8622a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Story idea</p>
          <p style={{ fontSize: 16, color: "#c8c4be", lineHeight: 1.7, margin: 0, minHeight: 50, transition: "opacity 0.4s" }} key={idx}>
            {STORIES[idx]}
          </p>
          <Link href="/create" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "#e8622a", textDecoration: "none", fontWeight: 600 }}>
            Turn this into a story →
          </Link>
        </div>
      </main>

      <footer style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: 13, borderTop: "1px solid #1a1a1a" }}>
        Audigram by SHANKH — Audio stories for the next generation of Indian creators.
      </footer>
    </div>
  );
}

const nav: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "20px 32px", borderBottom: "1px solid #1a1a1a",
  position: "sticky", top: 0, background: "#0c0c0e", zIndex: 100,
};
const logo: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, letterSpacing: 2,
};
const navLink: React.CSSProperties = {
  color: "#9e9a94", textDecoration: "none", fontSize: 14, fontWeight: 500,
};
