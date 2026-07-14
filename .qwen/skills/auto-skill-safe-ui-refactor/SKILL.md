---
name: safe-ui-refactor
description: Do a styling-only UI overhaul in this Next.js app without breaking the data/logic ecosystem, verified via git status/diff
source: auto-skill
extracted_at: '2026-07-14T10:30:00.000Z'
---

# Safe presentation-layer refactors (ZerAnime Next.js app)

When the user asks to modernize/polish the UI "tanpa merusak ecosystem" (without
breaking data/logic), the ONLY safe files to touch are the presentation layer:
`app/**/page.tsx` markup, `components/*.tsx`, and `app/globals.css`. 
Avoid changing `lib/scraper.ts` (data layer) or `hooks/use-favorites.ts` (favorites logic) unless the upstream source has changed and a minimal, well‑tested adjustment is required (see “Handling data source changes” below).

## Workflow

1. **Pin scope + accent up front** with `ask_user_question` (e.g. "menyeluruh tapi
   aman" vs. minimal; accent color). Large UI changes are easier to accept when
   scope was agreed before editing.
2. **Read each file before editing.** This tool session throws
   "File has not been read in this session. Use the read_file tool first" if you
   `edit` a file you haven't read this session. Read (even partial) first, always.
3. **Do color/token sweeps with grep, not memory.** To replace an old accent
   (e.g. `#ff4e00` → `#ff9d00`/`#ff6a00`), `grep_search` the pattern across the
   repo to find EVERY reference, edit each, then grep again to confirm 0 matches.
   - Caveat: plain `grep_search` can match `tsconfig.tsbuildinfo` (build cache
     noise). Use `glob: "*.tsx"` to scope to source files.
   - Watch for **dead components** (e.g. `EpisodePlayer.tsx` is not imported
     anywhere; the live player is `VideoPlayer.tsx`). Don't chase stragglers in
     unused files — leave them to avoid scope creep, just note it to the user.
4. **Reuse already-fetched data for new UI.** A hero/spotlight can reuse existing
   `resTop`/`resHome` results in `app/page.tsx` — do NOT add new fetch calls
   (keeps the data layer untouched and respects rate limits).
5. **Handle data source changes minimally and safely.**  
   If an upstream endpoint disappears or changes (e.g. `/genre-list/` redirects),  
   you may need to adjust `lib/scraper.ts` to fetch from an alternative page  
   (e.g., the homepage) and update the parsing regex.  
   - Keep the function signature and return type unchanged.  
   - Verify that the shape of the returned data matches expectations (`items: AnimeItem[]` etc.).  
   - Run the same git‑diff checks to ensure only the scraper file changed and that the logic remains a pure fetch‑and‑parse transformation.
6. **Prove the ecosystem is intact BEFORE committing:**
   ```bash
   git status --short          # confirm scraper.ts & hooks are NOT listed (unless a deliberate, minimal scraper fix was made)
   git diff --stat             # all changes should be styling/markup only, plus any approved scraper tweak
   git diff app/page.tsx       # confirm fetch logic unchanged (only markup + reuse)
   git diff lib/scraper.ts     # if changed, review that it’s a minimal adapter change
   ```
7. **Commit only the presentation dirs** (and optionally the scraper if a minimal, verified fix was applied), excluding auto-gen skills:
   ```bash
   git add app/ components/    # NOT `git add .` — keeps .qwen/ out
   # if scraper fix-scraper-only:
   # git add lib/scraper.ts
   git commit -m "feat(ui): ..."   # multi-line body via cat <<'EOF' heredoc
   git push origin main        # Vercel auto-deploys
   ```
   Confirm push destination/scope with the user for large changes.

## Build verification note
`node_modules` is NOT installed in this Termux sandbox, so `npm run build` /
`npx tsc --noEmit` cannot run (module-not-found noise). Rely on git diff review +
Vercel's build for type/build validation.

## Mobile-friendly patterns used here
- `BottomNav.tsx`: `md:hidden fixed bottom-0 inset-x-0 z-50` + safe-area-inset
  padding; pair with a `.has-bottom-nav` CSS class (media max-width:767px →
  `padding-bottom`) on `main`/`footer` so content isn't hidden behind the nav.
- `usePathname()` for active nav highlight state.
- Custom design tokens + utilities live in `app/globals.css` under Tailwind v4
  `@import "tailwindcss"` (brand-gradient text clip, `.no-scrollbar`, skeleton
  shimmer, fade-in animations).

## Accent rebrand (color sweep) — full theme change

When rebranding the accent (e.g. orange `#ff6a00`/`#ff9d00` → violet
`#7c3aed`/`#a78bfa`/`#c084fc`), it touches ~40+ refs across ~12 files. Efficient
order that worked:
1. Update the CSS tokens/`brand-gradient`/`::selection` in `app/globals.css` first.
2. For files that use only ONE old color, use `edit` with `replace_all: true` per
   file (fast, safe).
3. **Gotcha — `replace_all` breaks later multi-color edits:** if a file has BOTH
   `#ff6a00` and `#ff9d00` and you `replace_all` `#ff9d00`→`#a78bfa` first, a
   subsequent `edit` whose `old_string` contains the ORIGINAL mixed pair
   (e.g. `from-[#ff6a00] to-[#ff9d00]`) will FAIL ("0 occurrences") because half
   already changed. Do the mixed-string edits BEFORE the `replace_all`, or match
   against the already-half-updated string.
4. **Final grep MUST return 0:** `grep_search` `ff6a00|ff9d00|ff4e00` with
   `glob: "*.tsx"` after all edits to confirm no straggler.
5. **Contrast fix when gradient hue changes:** orange buttons used `text-black` +
   `fill-black`; on a violet gradient that's illegible — switch to `text-white` +
   `fill-white`. Check every `bg-gradient-to-r from-[accent]` button/pill.

## Animation patterns (halus & profesional, mobile-safe)

Added to `app/globals.css` and reused across components:
- **Staggered reveal**: `.reveal { opacity:0; animation: fadeInUp … both;
  animation-delay: calc(var(--i,0) * 60ms); }`. Apply per homepage section in
  `app/page.tsx` markup only:
  `<section className="reveal" style={{ '--i': idx } as React.CSSProperties}>`
  (cast to `React.CSSProperties` to satisfy TS for the custom `--i` prop).
- **Ken Burns hero**: `@keyframes kenburns` scale+`translate3d` over ~12s; add
  `animate-kenburns` to the ACTIVE slide's `<Image>` only.
- **Glassmorphism nav/bottom-nav**: a `.glass` utility (backdrop-filter blur+
  saturate) plus a Tailwind `supports-[backdrop-filter]:bg-[#0a0c10]/70` +
  opaque `bg-[#0a0c10]` fallback for browsers without backdrop-filter.
- **Card lift**: `hover:-translate-y-1` on the card `<Link>` + violet
  `group-hover:shadow-[accent]/20` glow.
- **Always add** `@media (prefers-reduced-motion: reduce)` that disables the new
  animations (`animation:none; opacity:1`) — keeps it professional and accessible.
- Watch typos in CSS `transform` (`translate3d`, not `transl3d`) — no build step
  here catches it, so re-read the keyframe after writing.

## Recent lessons (applied during UI overhaul)
- When the genre list page disappeared, switched `getGenresList` to scrape genre links from the homepage sidebar, updating the regex to tolerate `rel="tag"` and other attributes.
- Added a client‑side search form to `/search/page.tsx` because the bottom‑nav Search button routed to an empty page; the navbar search (hidden in mobile menu) was moved into the page itself for better UX.
- Verified after each edit that `git status` showed no changes to `hooks/use-favorites.ts` and that only the intended files were touched.
- Full violet rebrand + animations (2026-07-14): 17 presentation files changed,
  `lib/scraper.ts` & `hooks/` untouched, `git diff app/page.tsx` confirmed
  markup-only. Committed with `git add app/ components/` (kept `.qwen/` out).
