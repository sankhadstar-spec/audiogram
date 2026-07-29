# Audigram

Audio stories for the next generation of Indian creators. TikTok-style vertical feed for audio content — browse, like, comment, follow, publish from the Studio.

## What's in the box

| File / Folder | What it is |
|---|---|
| `backend/` | Next.js 15 app — API routes + NextAuth + root page |
| `audigram-feed.html` | Standalone feed UI (also served at `/feed` via `public/`) |
| `audigram-studio.html` | Standalone studio UI (also served at `/studio` via `public/`) |

## Deploy to Vercel (same motion as GitHub Pages, but for a real backend)

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "init"
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
| `GOOGLE_CLIENT_ID` | console.cloud.google.com → APIs & Services → Credentials |
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
| GET | `/api/audios` | public | Feed — supports `?genre=Folk+tale&cursor=xxx&limit=12` |
| POST | `/api/audios` | required | Publish a story |
| GET | `/api/audios/:id` | public | Single audio + play count increment |
| POST | `/api/audios/:id/like` | required | Toggle like |
| GET | `/api/audios/:id/comments` | public | List comments |
| POST | `/api/audios/:id/comments` | required | Post a comment |
| POST | `/api/creators/:id/follow` | required | Toggle follow |
| POST | `/api/upload` | required | Get R2 presigned upload URL |
| GET/POST | `/api/auth/*` | — | NextAuth (sign-in, callback, session, sign-out) |

## Local dev

```bash
cd backend
cp .env.example .env   # fill in your values
npx prisma migrate dev --name init
npm run dev            # http://localhost:3000
```
