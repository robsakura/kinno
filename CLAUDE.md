# Kinno — CLAUDE.md

## What This Is
A movie-guessing web app. Users see a movie poster + title and guess:
- Release year (slider 1900–2026)
- IMDb rating (slider 1.0–10.0, 0.1 steps)
- 5 parental guide severity categories (Sex/Nudity, Violence/Gore, Profanity, Alcohol/Drugs, Frightening — each 0=None, 1=Mild, 2=Moderate, 3=Severe)

Scores are saved to a leaderboard. Google OAuth for sign-in; guests can play but scores aren't persisted.

---

## Tech Stack
- **Next.js 14** (App Router, TypeScript) — SSR + API routes in one service
- **Tailwind CSS** — dark cinematic theme (`#0f172a` bg, `#F59E0B` gold accent)
- **Prisma 7** + **PostgreSQL** (Railway) — ORM
- **NextAuth v4** — Google OAuth only (`@auth/prisma-adapter`)
- **framer-motion** — animated slider reveal on results screen
- **cheerio** — server-side IMDb parental guide scraper (fallback)

## Data Sources
| Source | Used For | Notes |
|--------|----------|-------|
| TMDb API | Movie search, posters, trending, IMDb ID | Free, needs `TMDB_READ_ACCESS_TOKEN` |
| OMDb API | IMDb rating | Free tier: 1000 req/day, needs `OMDB_API_KEY` |
| IMDb scraper | Parental guide severity (0–3) | cheerio, DB-cached; `pgDataUncertain=true` on failure |
| Kaggle CSV | Bulk PG seed | Optional: `npx tsx scripts/seed-parental-guide.ts` |

---

## Critical Architecture Rules

### Prisma 7 — Different from Prisma 5/6
- **No `url` in `schema.prisma`** — datasource URL lives in `prisma.config.ts`
- **Runtime requires adapter**: `PrismaPg` from `@prisma/adapter-pg`
- `lib/prisma.ts` instantiates `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- **Migrations**: `npx prisma migrate dev` locally, `npx prisma migrate deploy` in CI/Railway

### Next.js API Routes
- All routes that hit the DB must export `export const dynamic = "force-dynamic"`
- Without this, Next.js tries to statically prerender them at build time → crashes

### Movie ID Convention
- `Movie.id` = IMDb ID string (e.g. `tt1375666`) — primary key
- `Movie.tmdbId` = TMDb integer ID — unique secondary key, used in URL params (`/game/[tmdbId]`)
- Game pages use TMDb IDs in the URL; all DB joins use IMDb IDs

### Auth
- No email/password — Google OAuth only
- Guests can play: submit returns score without saving
- `session.user.id` is injected via the session callback in `lib/auth.ts`
- NextAuth session type is augmented in `src/types/index.ts`

### Scoring (max 250 pts)
```
Year:    max(0, 100 - abs(guess - actual) × 10)
Rating:  max(0,  50 - abs(guess - actual) × 5)
Each PG: +20 if exact match  (5 categories = 100 max)
```

---

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Prisma singleton with PrismaPg adapter |
| `src/lib/tmdb.ts` | TMDb search, trending, movie detail |
| `src/lib/omdb.ts` | IMDb rating fetch |
| `src/lib/imdb-parental.ts` | DB cache → cheerio scraper fallback |
| `src/lib/scoring.ts` | Pure scoring functions |
| `src/lib/daily.ts` | Daily challenge: check DB, pick from trending, cache |
| `src/lib/auth.ts` | NextAuth config (Google + PrismaAdapter) |
| `src/app/api/movies/[tmdbId]/route.ts` | Core data assembler (TMDb + OMDb + PG) |
| `src/app/api/guess/route.ts` | Submit guess, validate, score, save |
| `src/components/game/SliderGroup.tsx` | All 7 slider state |
| `src/components/results/SliderReveal.tsx` | Animated reveal (custom div-based slider, framer-motion) |
| `prisma/schema.prisma` | Full DB schema |
| `prisma.config.ts` | Prisma 7 datasource config (reads `DATABASE_URL`) |
| `railway.toml` | Build + deploy config for Railway |

---

## Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."        # Railway auto-injects

# NextAuth
NEXTAUTH_URL="https://kinno.rsapps.ca"
NEXTAUTH_SECRET="..."                  # openssl rand -base64 32

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# TMDb (developer.themoviedb.org — free)
TMDB_READ_ACCESS_TOKEN="..."
TMDB_API_KEY="..."

# OMDb (omdbapi.com — free: 1000 req/day)
OMDB_API_KEY="..."

# Public (exposed to browser)
NEXT_PUBLIC_TMDB_IMAGE_BASE="https://image.tmdb.org/t/p"
```

---

## Deployment

### Railway (full app + DB)
- Service: Next.js app (`npm start`)
- Database: Railway PostgreSQL plugin (auto-injects `DATABASE_URL`)
- Build: `railway.toml` runs `prisma migrate deploy` before `npm run build`
- Custom domain: `kinno.rsapps.ca` set in Railway → Settings → Networking

### Cloudflare DNS
- Record: `CNAME  kinno  →  <railway-provided-domain>.railway.app`
- Proxy: **DNS only (grey cloud)** — Railway handles SSL, Cloudflare proxying breaks Railway's cert
- Domain is on Cloudflare Registrar (rsapps.ca)

### Google OAuth Redirect URIs (must register both)
- `http://localhost:3000/api/auth/callback/google`
- `https://kinno.rsapps.ca/api/auth/callback/google`

---

## Local Development
```bash
# 1. Copy .env.example → .env.local and fill in values
# 2. Start DB locally or point to Railway dev DB
npx prisma migrate dev --name init   # first time only
npm run dev
```

## Optional: Seed Parental Guide Data
```bash
# Download Kaggle "IMDB Parental Guide" dataset by Barry Haworth → data/imdb_parental_guide.csv
npx tsx scripts/seed-parental-guide.ts
```
