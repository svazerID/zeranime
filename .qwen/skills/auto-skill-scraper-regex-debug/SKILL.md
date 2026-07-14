---
name: scraper-regex-debug
description: Debug/fix broken HTML-scraper regex in lib/scraper.ts by reproducing against real fetched HTML and validating with node
source: auto-skill
extracted_at: '2026-07-13T11:48:16.012Z'
---

# Debugging the otakudesu HTML scraper (`lib/scraper.ts`)

This app does NOT use the Jikan API (despite AGENTS.md). Data comes from scraping
`https://otakudesu.fit` HTML with regex in `lib/scraper.ts` (`fetchPage`,
`parseAnimeListing`, `getSearch`, `getDetail`, `getEpisode`). When a page shows
"Found 0 items" or missing results, it is almost always a **parser/regex** bug,
not a network bug.

## Workflow (don't edit blind — reproduce first)

1. **Fetch the real HTML locally** with the same User-Agent the code uses:
   ```bash
   curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     "https://otakudesu.fit/?s=jujutsu%20kaisen&post_type=anime" -o ./_tmp.html
   ```
   Note: encode spaces as `%20` to match `encodeURIComponent` in the code.
2. **Test the existing regex with a node one-liner** against `_tmp.html`. Print
   the captured `href`, derived slug, and title so you can see WHAT it matched:
   ```bash
   node -e 'const fs=require("fs");const h=fs.readFileSync("./_tmp.html","utf8");
   const r=/<a href="([^"]+)"[^>]*>[\s\S]*?<span class="epx">([^<]*)<\/span>[\s\S]*?<img src="([^"]+)"[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/g;
   let m,c=0;while((m=r.exec(h))){c++;console.log(c,JSON.stringify(m[1]),"|",m[4].trim());}console.log("TOTAL",c);'
   ```
3. **Diagnose greedy/lazy anchoring bugs.** A lazy `[\s\S]*?` with no leading
   anchor will latch onto the FIRST `<a href="...">` in the document — often the
   site logo (`<a href="/">`) — producing an empty slug that later gets dropped.
   On listing pages with many cards this hides (only 1 bad item); on the search
   page with few cards it drops everything → "Found 0 items".
4. **Anchor the regex to the card container.** Cards use `<div class="bsx">`.
   Prefix the pattern with `<div class="bsx">\s*` so it can only match real cards.
5. **Verify the fix does not regress other pages BEFORE editing.** The same
   `parseAnimeListing` powers home/ongoing/genre. Fetch the home page
   (`https://otakudesu.fit/`, has ~20 `bsx` blocks) and confirm old vs new match
   counts, and that no captured href is `"/"`.

## More parser bug patterns (beyond "0 items")

### 1. Attribute order is NOT guaranteed — never assume `class` before `src`
`getDetail` poster returned `null` because the old regex required
`class="ts-post-image"` to appear before `src=`, but the live markup is
`<img src="https://i1.wp.com/…jpg" class="ts-post-image wp-post-image …" …>`
(src FIRST). Fix pattern: match the whole tag by the distinguishing class, then
pull `src` out of the matched tag separately (order-independent):
```js
const posterTag = html.match(/<img[^>]*\bclass="[^"]*ts-post-image[^>]*>/)
               || html.match(/<img[^>]*\bts-post-image\b[^>]*>/);
let poster = null;
if (posterTag) { const s = posterTag[0].match(/\bsrc="([^"]+)"/); if (s) poster = s[1]; }
```
General rule: for any single tag, match the tag body first, then extract each
attribute with its own `/\battr="([^"]+)"/`. Don't hardcode attribute sequence.

### 2. Home/ongoing cards link to EPISODE urls, not series urls
Cards on the homepage/ongoing list point at
`…/liar-game-episode-15-subtitle-indonesia/`, so routing them straight through
sent users to the player instead of the detail page. In `parseAnimeListing`'s
`else` branch, derive the series slug by stripping the episode tail, then link to
`/anime/<slug>`:
```js
const last = url.split('/').filter(Boolean).pop() || '';
const seriesSlug = last.replace(/-episode-.*$/, '');
if (seriesSlug && seriesSlug !== last) { slug = seriesSlug; link = `/anime/${slug}`; }
else { slug = last; if (slug) link = `/episode/${slug}`; }
```
Verified: `liar-game-episode-15-subtitle-indonesia` → `/anime/liar-game`;
also correct for multi-word/season slugs (`grand-blue-season-3`,
`world-is-dancing`, long light-novel titles). The stripped slug matches the
`/series/<slug>/` detail endpoint.

## Confirmed facts about the source site
- otakudesu is behind Cloudflare but serves scrapable HTML to a normal UA
  (`cf-cache-status: DYNAMIC`, not a challenge). 0-results in prod is a parser
  bug, not a block — unless prod later shows a Cloudflare challenge page.
- Listing/search cards: `<div class="bsx"> <a href=".../series/<slug>/"> ...
  <span class="epx">...</span> ... <img src="..."> ... <h2>Title</h2>`. On the
  home/ongoing lists the `<a href>` is an episode url, not a series url (see #2).
- Detail poster `<img>` carries `class="ts-post-image wp-post-image …"` with the
  `src` attribute appearing BEFORE `class` (see #1).
- Internal routing maps source `/series/<slug>/` → app route `/anime/<slug>`;
  episode pages route to `/episode/<slug>`.

## Housekeeping
- Any temp files (`*.html`, downloaded images) created in the project root during
  debugging MUST be deleted when done (`rm -f`).
- Termux gotcha: `/tmp` is not writable — curl output there ends up SIZE:0. Write
  downloads to `/data/data/com.termux/files/home/.qwen/tmp/` instead.
- Termux gotcha: a shell var (`D=…; node -e '… process.env.D …'`) does NOT reach
  `node -e`'s `process.env` (it's not exported into the eval), so paths come out
  `undefined`. Hardcode the absolute path as a `const` inside the node script, or
  `export` the var first.
- `npx tsc --noEmit` in this sandbox fails with "Cannot find module next/*" because
  `node_modules` isn't installed here — that's environment noise, not your change.

## Viewing user-provided screenshots
`web_fetch` on image hosts (e.g. catbox.moe) is often content-blocked. Instead
`curl -sL -o ./img.jpg <url>` into the project dir, then `read_file` the image
(this model reads images). Delete the file afterward.
