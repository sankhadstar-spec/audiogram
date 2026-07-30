import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audigram — Your voice, a story worth hearing",
  description: "Create and share audio stories. Record your voice, generate with AI, publish to the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: "#0c0c0e", color: "#f0ede8", fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
