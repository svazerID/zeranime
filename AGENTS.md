# ZERANIME - AI Agent Guide

## Project Overview

**ZerAnime** (package name: `ai-studio-applet`) is a **Next.js 15** anime streaming application built with **React 19**, **TypeScript**, and **Tailwind CSS v4**. It uses the **Jikan API (MyAnimeList unofficial API)** to fetch anime data and streams episodes via `animeplay.cfd` iframes. The app features a dark-themed UI with orange/amber accents, favorites stored in localStorage, and server-side rendering with Next.js App Router.

**Project Name Discrepancy**: The package.json name is `ai-studio-applet` (likely an AI Studio template artifact), but the actual product name is **ZerAnime** (seen in metadata.json, layout.tsx branding, and UI).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Server Components by default) |
| Runtime | React 19, Node.js (deployed on Cloud Run / Vercel) |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS v4 (PostCSS), `tw-animate-css`, `clsx` + `tailwind-merge` |
| UI Components | Custom components + `lucide-react` icons |
| Theming | `next-themes` (dark mode forced, no system preference) |
| Data Fetching | Jikan API v4 (`api.jikan.moe/v4`) with `fetch` + Next.js cache (`revalidate: 3600`) |
| State | React `useState`/`useEffect` + localStorage (favorites) |
| Forms | `react-hook-form` + `@hookform/resolvers` (configured but minimally used) |
| Animations | `motion` (Framer Motion v12) |
| AI | `@google/genai` (configured via `GEMINI_API_KEY` env, capability declared in metadata.json) |
| Deployment | Next.js `output: 'standalone'` → Docker/Cloud Run; Firebase tools in dev deps |

---

## Project Structure

```
zeranime/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout: ThemeProvider, Navbar, Footer, fonts
│   ├── page.tsx                  # Home: staggered Jikan fetches (rate-limit aware), HorizontalScroller sections
│   ├── globals.css               # Tailwind v4 import only (1 line)
│   ├── anime/[slug]/             # Anime detail page
│   │   ├── page.tsx              # Server component: getDetail, episodes list, FavoriteButton
│   │   └── FavoriteButton.tsx    # Client component: localStorage favorites toggle
│   ├── episode/[slug]/page.tsx   # Episode page: iframe embed from animeplay.cfd
│   ├── search/page.tsx           # Search page: getSearch + Pagination
│   ├── schedule/page.tsx         # Weekly schedule by day (Indonesian day names → Jikan)
│   ├── genres/page.tsx           # Genre list page
│   ├── genre/[slug]/page.tsx     # Genre detail page with pagination
│   └── favorites/page.tsx        # Client page: localStorage favorites display
├── components/                   # Shared UI components
│   ├── AnimeCard.tsx             # Anime card (image, title, badge, play overlay)
│   ├── HorizontalScroller.tsx    # Horizontal scroll section with nav buttons
│   ├── Navbar.tsx                # Sticky nav: logo, links, search, theme toggle (forced dark)
│   ├── Pagination.tsx            # Prev/Next pagination with query string handling
│   └── theme-provider.tsx        # next-themes wrapper (client component)
├── hooks/
│   └── use-favorites.ts          # localStorage favorites hook (toggle, check, load)
├── lib/
│   ├── scraper.ts                # Jikan API wrapper: fetchJikan, mapAnime, all get* functions
│   └── utils.ts                  # `cn()` utility (clsx + tailwind-merge)
├── components.json               # (Not present - shadcn/ui not used)
├── next.config.ts                # Next.js config: standalone output, image remotePatterns, HMR disable flag
├── tsconfig.json                 # Strict TS, path alias @/*, Next.js plugin
├── eslint.config.mjs             # Flat config extending eslint-config-next
├── .eslintrc.json                # Legacy config (extends "next")
├── postcss.config.mjs            # Tailwind v4 + autoprefixer
├── package.json                  # Dependencies & scripts
├── metadata.json                 # App metadata for AI Studio deployment
├── .env.example                  # GEMINI_API_KEY, APP_URL placeholders
└── .gitignore                    # Standard Next.js ignores
```

---

## Key Architectural Decisions

### 1. **Server-First Data Fetching**
All data fetching happens in **Server Components** (async `page.tsx` files) using `fetch` with `next: { revalidate: 3600 }` for 1-hour ISR caching. The Jikan API has a strict rate limit (3 req/s), so `page.tsx` (home) staggers `Promise.all` batches with 600ms delays between groups.

### 2. **Jikan API Wrapper (`lib/scraper.ts`)**
- Single `fetchJikan(endpoint)` helper with error handling and 1hr cache
- TypeScript interfaces: `AnimeItem`, `AnimeListResponse`
- Mapper `mapAnime()` transforms Jikan response to internal `AnimeItem` shape
- Exports: `getHome`, `getTop`, `getPopular`, `getUpcoming`, `getMovies`, genre-specific (`getAction`, `getRomance`, etc.), `getSearch`, `getGenresList`, `getGenre`, `getDetail`, `getEpisode`, `getSchedule`

### 3. **Dark Mode Only**
`ThemeProvider` forces `forcedTheme="dark"` with `enableSystem={false}`. No light mode toggle in UI (icon buttons exist in Navbar but theme is locked).

### 4. **Client Components Only Where Needed**
- `Navbar` (search, mobile menu, theme toggle)
- `HorizontalScroller` (scroll buttons, ref)
- `AnimeCard` (Link + Image, no client state)
- `Pagination` (Link generation)
- `FavoriteButton` / `useFavorites` (localStorage)
- `ThemeProvider` (context provider)
- All pages are **Server Components** by default

### 5. **Episode Streaming**
Episode pages (`/episode/[slug]`) embed an iframe from `https://animeplay.cfd/stream/mal/{animeId}/{epId}/sub`. The `getEpisode` function constructs this URL and fetches episode metadata from Jikan.

### 6. **Favorites = localStorage Only**
No backend/auth. `useFavorites` hook manages `animeFavorites` key in localStorage. `FavoriteButton` client component uses this hook.

### 7. **Indonesian Locale for Schedule**
`getSchedule()` maps Indonesian day names (`senin`, `selasa`, etc.) to English for Jikan API.

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (Turbopack in Next 15)
npm run dev

# Production build (standalone output for Docker)
npm run build

# Start production server
npm start

# Lint (ESLint flat config)
npm run lint

# Clean Next.js cache
npm run clean
```

**Environment Variables** (see `.env.example`):
- `GEMINI_API_KEY` - Injected by AI Studio at runtime
- `APP_URL` - Injected by AI Studio (Cloud Run URL)

---

## Code Style & Conventions

| Aspect | Convention |
|--------|------------|
| **TypeScript** | Strict mode, `esModuleInterop`, `bundler` module resolution, path alias `@/*` |
| **Components** | PascalCase `.tsx`, `'use client'` only when needed (hooks, browser APIs) |
| **Server Components** | Default for pages; async `page.tsx` with `await` data fetching |
| **Styling** | Tailwind v4 utilities, `cn()` utility for class merging, dark mode via `bg-[#050505] text-[#e0e0e0]` custom colors |
| **Icons** | `lucide-react` (tree-shakeable imports) |
| **Images** | `next/image` with `remotePatterns` allowing all http/https hosts |
| **Links** | `next/link` for internal navigation |
| **Error Handling** | `fetchJikan` returns empty arrays on failure (graceful degradation) |
| **Rate Limiting** | Home page staggers `Promise.all` batches with `setTimeout(600ms)` |

---

## Testing & Quality

| Tool | Status |
|------|--------|
| **TypeScript** | `tsc --noEmit` runs during `next build` |
| **ESLint** | `npm run lint` (flat config, extends `eslint-config-next`) |
| **Unit Tests** | **None configured** (no Jest, Vitest, or React Testing Library in deps) |
| **E2E Tests** | **None configured** |
| **Pre-commit** | **None configured** (no Husky, lint-staged) |

> **Note**: No test infrastructure exists. Adding tests would require installing a test runner and configuring it.

---

## Deployment

### Build Output
```typescript
// next.config.ts
output: 'standalone'  // Creates .next/standalone for Docker
```

### Docker / Cloud Run (AI Studio default)
- Build produces standalone server in `.next/standalone`
- `Dockerfile` not in repo (AI Studio generates it)
- `GEMINI_API_KEY` and `APP_URL` injected at runtime via Cloud Run secrets/env

### Vercel (Alternative)
- Works out of the box with Next.js
- `output: 'standalone'` also compatible

### Firebase
- `firebase-tools` in devDependencies (likely for legacy/deploy scripts)

---

## Key Files Reference

### `lib/scraper.ts` - Data Layer
Core API client. All Jikan calls go through `fetchJikan()`. Exports typed functions for every page. Handles:
- Anime list mapping (`AnimeItem`)
- Detail + episodes mapping
- Search, genres, schedule
- Error fallback to empty arrays

### `app/layout.tsx` - App Shell
- `Inter` font (Google Fonts)
- `ThemeProvider` (forced dark)
- `Navbar` (sticky, search, mobile menu)
- Footer with branding links

### `app/page.tsx` - Home Page
Most complex page. Fetches 13+ endpoints in 4 staggered batches to respect Jikan's 3 req/s limit. Renders multiple `HorizontalScroller` sections.

### `hooks/use-favorites.ts` - Client State
Simple localStorage wrapper. Returns `{ favorites, toggleFavorite, isFavorite, isLoaded }`.

### `components/HorizontalScroller.tsx` - Reusable Carousel
Horizontal scroll with snap, hide scrollbar, left/right buttons (hidden on mobile).

### `next.config.ts` - Build Config
- `output: 'standalone'`
- `images.remotePatterns`: allow all http/https
- `transpilePackages: ['motion']`
- HMR disable via `DISABLE_HMR=true` env (AI Studio specific)

---

## Known Limitations & Gotchas

1. **No Tests** - Zero test coverage. Add Vitest/Jest + React Testing Library if needed.
2. **No Auth/Backend** - Favorites are localStorage only. No user accounts, no sync.
3. **Jikan Rate Limits** - Home page staggers requests; other pages may hit limits under load.
4. **Stream Source** - Hardcoded `animeplay.cfd` iframe. No fallback sources.
5. **Dark Mode Only** - Theme toggle in Navbar is decorative (theme forced to dark).
6. **Indonesian Locale Hardcoded** - Schedule day mapping assumes Indonesian day names.
7. **Legacy ESLint Config** - Both `eslint.config.mjs` (flat) and `.eslintrc.json` (legacy) exist; flat config is used.
8. **Empty README** - No project documentation in repo.
9. **Package Name Mismatch** - `package.json` name is `ai-studio-applet`, not `wibufinal` or `zeranime`.

---

## Extending the Project

### Add New Anime Source
1. Add new function in `lib/scraper.ts` (or new file)
2. Follow `AnimeItem` interface
3. Add page in `app/` using Server Component

### Add User Authentication
1. Add auth provider (NextAuth, Clerk, Firebase Auth)
2. Replace `useFavorites` localStorage with server-synced storage
3. Protect `/favorites` and `FavoriteButton` with auth

### Add Tests
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
# Add vitest.config.ts, setup test scripts
```

### Enable Light Mode
1. Remove `forcedTheme="dark"` and `enableSystem={false}` from `ThemeProvider`
2. Update Tailwind colors to support light/dark variants
3. Ensure Navbar theme toggle works

---

## File Path Quick Reference

| Need | File |
|------|------|
| Add new anime page | `app/anime/[slug]/page.tsx` |
| Add new API endpoint | `lib/scraper.ts` |
| New UI component | `components/` |
| Client state hook | `hooks/` |
| Global styles | `app/globals.css` |
| Build config | `next.config.ts` |
| TS config | `tsconfig.json` |
| Lint config | `eslint.config.mjs` |
| Env vars | `.env.example` |

---

*Generated from codebase analysis. Update this file when architecture changes.*