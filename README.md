# Audigram v2.0

Audio stories for the next generation of Indian creators. TikTok-style vertical feed for audio content — browse, like, comment, follow, publish from the Studio.

## What's in the box

| File / Folder | What it is |
|---|---|
| `backend/` | Next.js 15 app — API routes + NextAuth + root page |
| `audigram-feed.html` | Standalone feed UI (also served at `/feed` via `public/`) |
| `audigram-studio.html` | Standalone studio UI (also served at `/studio` via `public/`) |
| `app/api/generate-story/route.ts` | Dynamic story generation (Gemini → Pollinations → OpenRouter) |
| `app/api/tts/route.ts` | Multi-tier TTS (Groq → Edge → OpenAI → WAV fallback) |

## v2.0 Changes

### Bug Fixes
- **Story Generation**: Replaced repetitive boilerplate templates with true dynamic prompt crafting using Gemini 2.5 Flash. Every prompt yields a unique, long-form narrative. Supports all languages (Bengali, Hindi, English, Spanish, etc.)
- **Audio Generation**: Fixed TTS route with multi-tier fallback system (Groq PlayAI → Edge TTS → OpenAI → Sarvam → WAV). Fixed binary buffer casting for Next.js strict mode compatibility.

### New Features
- **PDF Export**: Download generated stories as formatted PDF documents using jsPDF
- **Audio Download**: Export final audio as MP3 or WAV files
- **Social Sharing**: Native Web Share API for one-tap mobile sharing (WhatsApp, Telegram, system share sheet)
- **Platform Presets**: Formatted sharing presets for YouTube (long-form), Instagram Reels/TikTok/Shorts (vertical snippet), and direct link copying
- **UI Improvements**: Live word count, character count, reading time estimate, audio playback progress bar
- **State Pipeline**: Smooth step management: Step 1 (Story) → Step 2 (Voice) → Step 3 (Soundscape) → Step 4 (Cover Art) → Step 5 (Export & Share)

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "audiogram v2.0"
gh repo create audigram --public --source=. --push
# or: git remote add origin https://github.com/YOU/audigram && git push -u origin main
```

### 2. Import on Vercel

1. vercel.com → **Add New Project** → import your repo
2. **Root Directory**: set to `backend`
3. Add env vars (Settings → Environment Variables):

| Key | Where to get it |
|---|---|
| `DATABASE_URL` | Neon / Supabase / Railway — free tier Postgres |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key |
| `GROQ_API_KEY` | console.groq.com → API Keys (free tier) |
| `OPENAI_API_KEY` | platform.openai.com (optional) |
| `OPENROUTER_API_KEY` | openrouter.ai (optional) |
| `GOOGLE_CLIENT_ID` | console.cloud.google.com → Credentials |
| `GOOGLE_CLIENT_SECRET` | same |
| `AUTH_SECRET` | run `npx auth secret` locally, paste the output |
| `NEXTAUTH_URL` | your Vercel URL e.g. `https://audigram.vercel.app` |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage API tokens |
| `R2_SECRET_ACCESS_KEY` | same |
| `R2_BUCKET_NAME` | name of your R2 bucket |

4. **Deploy** → Vercel auto-builds on every `git push main` from here on.

### 3. Set up the database

After first deploy, run from your local machine:

```bash
cd backend
DATABASE_URL="your-neon-url" npx prisma migrate dev --name init
```

### 4. Add Google OAuth redirect URI

In Google Cloud Console → your OAuth client → Authorized redirect URIs, add:

```
https://YOUR_VERCEL_DOMAIN/api/auth/callback/google
```

---

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/generate-story` | public | Dynamic story generation (Gemini → Pollinations → OpenRouter) |
| POST | `/api/tts` | public | Multi-tier TTS (Groq → Edge → OpenAI → WAV) |
| GET | `/api/audios` | public | Feed — supports `?genre=Folk+tale&cursor=xxx&limit=12` |
| POST | `/api/audios` | required | Publish a story |
| GET | `/api/audios/:id` | public | Single audio + play count increment |
| POST | `/api/audios/:id/like` | required | Toggle like |
| GET | `/api/audios/:id/comments` | public | List comments |
| POST | `/api/audios/:id/comments` | required | Post a comment |
| POST | `/api/creators/:id/follow` | required | Toggle follow |
| POST | `/api/upload` | required | Get R2 presigned upload URL |
| GET/POST | `/api/auth/*` | — | NextAuth (sign-in, callback, session, sign-out) |

## Story Generation API

```bash
curl -X POST http://localhost:3000/api/generate-story \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A detective in 1920s Calcutta investigates a haunted mansion",
    "genre": "horror / suspense",
    "length": "medium (roughly 350-450 words)",
    "language": "English"
  }'
```

Response:
```json
{
  "story": "...",
  "text": "...",
  "provider": "gemini",
  "seed": 1722198000123,
  "wordCount": 412
}
```

## TTS API

```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test narration.",
    "voice": "PlayAI-Dialog",
    "language": "en"
  }' \
  --output narration.mp3
```

## Local dev

```bash
cd backend
cp .env.example .env   # fill in your values
npx prisma migrate dev --name init
npm run dev            # http://localhost:3000
```
