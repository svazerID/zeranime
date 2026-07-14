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

## Recent lessons (applied during UI overhaul)
- When the genre list page disappeared, switched `getGenresList` to scrape genre links from the homepage sidebar, updating the regex to tolerate `rel="tag"` and other attributes.
- Added a client‑side search form to `/search/page.tsx` because the bottom‑nav Search button routed to an empty page; the navbar search (hidden in mobile menu) was moved into the page itself for better UX.
- Verified after each edit that `git status` showed no changes to `hooks/use-favorites.ts` and that only the intended files were touched.
