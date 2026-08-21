# ZerAnime

Aplikasi streaming anime berbasis **Next.js 15**, **React 19**, **TypeScript**, dan **Tailwind CSS v4**. Mengambil data dengan **scraping** dari `x6.sokuja.uk` (via `cheerio`) dan memutar episode langsung dari file `.mp4` upstream. Antarmuka bertema gelap dengan aksen ungu (gaya Crunchyroll), favorit disimpan di `localStorage`, dan rendering server-side dengan Next.js App Router.

> **Catatan**: nama paket di `package.json` sudah `zeranime` (sebelumnya artefak template `ai-studio-applet`).

## 📦 Teknologi

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 15 (App Router, Server Components by default) |
| Runtime | React 19, Node.js ≥ 20 (deploy di Vercel) |
| Bahasa | TypeScript 5.9 |
| Styling | Tailwind CSS v4 (PostCSS), `tw-animate-css`, `clsx` + `tailwind-merge`, `class-variance-authority` |
| Komponen UI | Komponen kustom + `lucide-react` (ikon) |
| Tema | `next-themes` (dark mode), aksen ungu |
| Pengambilan Data | Scraping `x6.sokuja.uk` dengan `cheerio` + `fetch` Next.js (cache ISR `revalidate`) |
| Proxy Aset | Route same-origin `/api/asset` (gambar) & `/api/video` (mp4) — lewat `cors.caliph.my.id` saat di Vercel |
| State | React `useState`/`useEffect` + `localStorage` (favorit) |
| Animasi | `motion` (Framer Motion) |

## 🗂 Struktur Proyek

```
zeranime/
├── app/
│   ├── layout.tsx               # Root layout: ThemeProvider, Navbar/BottomNav, fonts
│   ├── page.tsx                 # Home: HeroSpotlight + section horizontal scroller + pagination
│   ├── globals.css              # Tailwind v4 import
│   ├── anime/[slug]/            # Detail anime
│   │   ├── page.tsx             # Server component: getDetail, daftar episode, FavoriteButton
│   │   └── FavoriteButton.tsx   # Client: toggle favorit di localStorage
│   ├── episode/[slug]/page.tsx  # Episode: VideoPlayer (mp4 via /api/video)
│   ├── search/page.tsx          # Pencarian: getSearch + pagination
│   ├── schedule/page.tsx        # Jadwal rilis mingguan
│   ├── genres/page.tsx          # Daftar genre
│   ├── genre/[slug]/page.tsx    # Anime per genre + pagination
│   ├── favorites/page.tsx       # Favorit dari localStorage
│   └── api/
│       ├── asset/route.ts       # Proxy gambar/poster same-origin
│       └── video/route.ts       # Proxy stream mp4 same-origin (forward Range)
├── components/
│   ├── AnimeCard.tsx            # Card anime (poster via /api/asset, badge, overlay)
│   ├── HeroSpotlight.tsx        # Hero carousel beranda
│   ├── VideoPlayer.tsx          # Pemutar <video> mp4 (src via /api/video) — dipakai halaman episode
│   ├── EpisodePlayer.tsx        # Pemutar lama berbasis iframe (tidak digunakan)
│   ├── HorizontalScroller.tsx   # Section scroll horizontal + nav
│   ├── Navbar.tsx / BottomNav.tsx
│   ├── Pagination.tsx
│   └── theme-provider.tsx       # next-themes wrapper
├── hooks/use-favorites.ts       # Hook localStorage favorit
├── lib/
│   ├── scraper.ts               # Scraper x6.sokuja.uk: getHome, getDetail, getEpisode, dsb.
│   └── utils.ts                 # utilitas cn()
├── next.config.ts               # output standalone, image remotePatterns '**'
├── tsconfig.json, eslint.config.mjs, postcss.config.mjs
├── package.json, metadata.json, .env.example, .gitignore
└── README.md                    # <-- Anda sedang membacanya
```

## 🔌 Arsitektur Proxy (Penting)

Upstream (`x6.sokuja.uk` beserta CDN media `storages.sokuja.uk` / `global.nontony.uk`) memblokir:

- **IP egress Vercel** → fetch server-side dari Vercel gagal (502 pada optimizer gambar).
- **Referer `zeranime.vercel.app`** pada file media → CDN balas **403** (200/206 untuk tanpa referer atau referer `x6.sokuja.uk`).

Solusi: dua route proxy **same-origin** di `app/api/`:

- **`/api/asset?url=...`** — untuk poster/gambar. Browser memuat dari origin sendiri (`unoptimized`), server mengambil lewat `cors.caliph.my.id` dengan `Referer: https://x6.sokuja.uk/`.
- **`/api/video?url=...`** — untuk stream `.mp4`. Meng-forward header `Range` agar seek berfungsi, lalu di-stream ke klien dari origin sendiri sehingga CDN tidak pernah menerima referer cross-origin.

> Saat development (bukan Vercel), kedua proxy menembak upstream secara langsung tanpa `cors.caliph.my.id`.

## 🚀 Memulai

### Prasyarat
- Node.js ≥ 20
- npm / yarn / pnpm

### Instalasi

```bash
git clone https://github.com/svazerID/zeranime.git
cd zeranime
npm install
```

### Variabel Lingkungan

`.env.example` berisi `GEMINI_API_KEY` dan `APP_URL` (artefak template AI Studio; opsional untuk fitur AI). Vercel mengisi `APP_URL` otomatis saat deploy.

```env
GEMINI_API_KEY=your_key   # opsional
APP_URL=https://zeranime.vercel.app
```

### Pengembangan

```bash
npm run dev     # Next 15 dev server
```

Buka <http://localhost:3000> di browser Anda.

### Produksi

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## 📖 Panduan Penggunaan

- **Beranda** (`/`): HeroSpotlight + chip genre + section scroller (Latest Updated, Most Viewed, New Release, Upcoming, Top Movies, serta section per genre).
- **Detail Anime** (`/anime/[slug]`): poster, judul, rating, studio, genre, sinopsis, dan daftar episode.
- **Episode** (`/episode/[slug]`): pemutar video `.mp4` (proxy `/api/video`) dengan pilihan kualitas server (480p/720p/1080p).
- **Pencarian** (`/search`): cari berdasarkan judul + paginasi.
- **Jadwal** (`/schedule`): jadwal rilis mingguan.
- **Genre** (`/genres` dan `/genre/[slug]`): daftar anime per genre.
- **Favorit** (`/favorites`): simpan anime di `localStorage`; tombol love di halaman detail untuk menambah/mengurangi.

## 🤝 Kontribusi

Kami menyambut kontribusi! Jika ingin memperbaiki bug, menambah fitur, atau meningkatkan dokumentasi:

1. Fork repositori ini.
2. Buat branch fitur: `git checkout -b fitur/nama-fitur`.
3. Lakukan perubahan, lalu commit dengan pesan yang jelas. Push ke branch Anda dan buat Pull Request ke `main`.
4. Pastikan kode melewati linter (`npm run lint`).

> **Catatan**: Proyek saat ini tidak memiliki konfigurasi tes otomatis. Jika Anda ingin menambah uji, silakan sertakan dalam PR.

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut.

---

Selamat menikmati anime dengan ZerAnime! 🎌
Jika ada pertanyaan atau masukan, buka *issue* atau hubungi maintainer.
