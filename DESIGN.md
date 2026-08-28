# ZerAnime — Design Document

Ringkasan arsitektur ZerAnime: app streaming anime Next.js 15 (App Router) yang
**scrape** dari upstream `x6.sokuja.uk`, menampilkan dalam tema gelap ala
Crunchyroll, dan memutar episode **langsung dari CDN upstream** (tanpa proxy).

## Misi & Batasan

- Data (metadata + stream episode) di-*scrape* dari `x6.sokuja.uk` — **tidak ada
  API resmi**.
- **Server-side only** untuk semua fetch/parse (lihat memori & `lib/scraper.ts`).
  Menjalankan scraping di browser → CORS/anti-hotlink → HTML kosong → 0 hasil.
- Upstream memblokir **IP egress Vercel** dan **Referer `zeranime.vercel.app`**
  pada file media. Solusi: media dimuat **langsung oleh browser dari CDN** dengan
  `referrerPolicy="no-referrer"` (lihat bagian Aset & Video).
- Deploy target: Vercel. Build hanya diverifikasi di Vercel (node_modules tidak
  terpasang lokal di setup Termux/Android user).

## Alur Permintaan (Request Flow)

### 1. Halaman data (Server Component)
```
Browser → [Server] getXxx(scraper) → fetch upstream (via cors.caliph.my.id di Vercel)
        → cheerio parse → React render → HTML → Browser
```
- Server Component `await` fungsi `lib/scraper.ts`, hasil di-cache ISR (`revalidate`).
- Interaktivitas kecil dipisah ke Client Component tipis (cth. `SearchBox.tsx`).

### 2. Aset & Video (Langsung dari CDN, tanpa proxy)
Poster & episode `.mp4` dimuat **langsung oleh browser dari CDN upstream**, bukan
lewat origin sendiri. Ini keputusan penting untuk menghemat bandwidth Vercel.

- CDN video (`storages.sokuja.uk`) hanya memblokir jika ada **Referer asing**.
  Dengan `referrerPolicy="no-referrer"` pada `<video>`/`<iframe>`, browser tidak
  mengirim Referer → CDN balas **206 Partial Content** + `accept-ranges: bytes`
  (seeking jalan normal).
- CDN gambar (`gbr.sokuja.uk`) **tidak memblokir Referer sama sekali** → poster
  bisa dimuat langsung tanpa trik apa pun.

Hasil: **0 byte bandwidth Vercel untuk media.** Sebelumnya proxy `/api/video`
membakar ~21 GB Fast Data Transfer dalam 12 jam (302% kuota free tier, akun
di-pause) — lihat commit `deb8eaf`.

> Route `/api/asset` & `/api/video` masih ada di `app/api/` sebagai fallback,
> tapi tidak lagi dipakai oleh komponen mana pun.

## Lapisan Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 15, App Router, Server Components by default |
| UI | React 19, Tailwind CSS v4, `lucide-react`, `motion` (Framer) |
| Tema | `next-themes` (dark mode), aksen ungu |
| Data | Scraping `cheerio` + `fetch` Next.js (cache ISR `revalidate`) |
| State favorit | `localStorage` via `hooks/use-favorites.ts` |
| Variabel env | `APP_URL` (diisi Vercel), `GEMINI_API_KEY` (opsional, artefak template) |

> `GEMINI_API_KEY` & `@google/genai` adalah artefak template AI Studio — fitur AI
> tidak digunakan oleh alur utama.

## Struktur Direktori

```
app/
  layout.tsx                 # Root: ThemeProvider, Navbar/BottomNav, fonts
  page.tsx                   # Home: Hero + horizontal scroller + pagination
  anime/[slug]/page.tsx      # Detail: getDetail + daftar episode
  anime/[slug]/FavoriteButton.tsx  # Client: toggle favorit localStorage
  episode/[slug]/page.tsx    # Episode: VideoPlayer (mp4 langsung dari CDN)
  search/page.tsx            # getSearch (server) + pagination
  schedule/page.tsx          # Jadwal rilis
  genres/page.tsx & genre/[slug]/page.tsx
  favorites/page.tsx         # Dari localStorage
  api/asset/route.ts         # (fallback, tak terpakai) Proxy gambar same-origin
  api/video/route.ts         # (fallback, tak terpakai) Proxy stream mp4
components/
  AnimeCard, HeroSpotlight, VideoPlayer, EpisodePlayer(usang), Navbar,
  BottomNav, Pagination, theme-provider, HorizontalScroller
hooks/use-favorites.ts
lib/scraper.ts               # getHome/getNew/getTop/getUpcoming/getMovies/getGenre/
                             # getSearch/getGenresList/getDetail/getEpisode/getSchedule
lib/utils.ts                 # cn()
```

## Scraper (`lib/scraper.ts`)

Single entry `getListing({order,status,type,genre,s}, page)` → `fetchPage` →
`parseListing` → `AnimeItem[]`. Endpoint upstream `BASE_URL/anime/` dengan query.
`fetchPage` menyisipkan `Referer: x6.sokuja.uk`, UA browser, dan header IP palsu
(`X-Forwarded-For` dll) untuk lolos proteksi upstream.

- `getHome` (order=update), `getNew` (latest), `getTop`/`getPopular` (popular),
  `getUpcoming` (status=upcoming), `getMovies` (type=movie), `getGenre(slug)`.
- `getDetail(slug)` → parse h1/poster/rating/genre/meta/sinopsis/episodes.
- `getEpisode(slug)` → scrape `episodeId` dari inline script → fetch
  `api/video-mirrors?e=<id>` → daftar stream (480p/720p/1080p). Juga derivasi
  prev/next + daftar episode dari halaman detail anime.
- `getGenresList` / `getSchedule`.

## Episode & Video

- `getEpisode` menghasilkan daftar `streams` (server + kualitas) di-upstream.
- `VideoPlayer` memilih kualitas dan mengarahkan `<video src="<mp4-cdn>">`
  **langsung** ke URL CDN, dengan `referrerPolicy="no-referrer"` agar CDN tidak
  memblokir (CDN hanya menolak Referer asing).
- Seeking bekerja karena CDN mendukung `Range` (`accept-ranges: bytes`).

## Keamanan

- Scraping hanya di server (tidak pernah expose logika parse/credentials ke klien).
- Media dimuat langsung oleh browser dari CDN upstream — tidak ada proxy publik
  yang bisa disalahgunakan (SSRF) karena route proxy tidak lagi dipakai.

## Keputusan Arsitektur (Catatan)

- **Media langsung dari CDN, BUKAN proxy.** Proxy `/api/video` pernah dipakai
  (commit `901bcb8`) karena CDN memblokir Referer Vercel, tapi membakar ~21 GB
  Fast Data Transfer dalam 12 jam → akun Vercel di-pause. Solusi final:
  `referrerPolicy="no-referrer"` pada `<video>`/`<iframe>` (commit `deb8eaf`).
  CDN hanya menolak jika ada Referer asing; tanpa Referer → 206 + Range OK.
- ID acak `Math.floor(Math.random*100000)` untuk `AnimeItem.id` — tidak stabil antar
  render (deckhand untuk key React); bisa diganti hash slug bila butuh stabilitas.

## Verifikasi

- `npm run lint`
- Build & deploy hanya diverifikasi di Vercel (push main → auto-deploy).
- Tidak ada suite tes otomatis; risiko regresi dijaga pola Server Component +
  proxy yang konsisten.