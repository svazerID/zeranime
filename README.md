# ZerAnime

Anime streaming application built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. Uses the **Jikan API** (unofficial MyAnimeList) for data and streams episodes via `animeplay.cfd` iframes. Features a dark‑theme UI with orange/amber accents, favorites stored in `localStorage`, and server‑side rendering with the Next.js App Router.

> **Catatan**: Nama paket di `package.json` adalah `ai-studio-applet` (artefak template AI Studio), namun nama produknya adalah **ZerAnime** (lihat `metadata.json`, `layout.tsx`, dan UI).

## 📦 Teknologi

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 15 (App Router, Server Components by default) |
| Runtime | React 19, Node.js (deployed on Cloud Run / Vercel) |
| Bahasa | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS v4 (PostCSS), `tw-animate-css`, `clsx` + `tailwind-merge` |
| Komponen UI | Komponen kustom + `lucide-react` (ikon) |
| Tematização | `next-themes` (dark mode forced, tidak ada toggle sistem) |
| Pengambilan Data | Jikan API v4 (`api.jikan.moe/v4`) dengan `fetch` + cache ISR (`revalidate: 3600`) |
| State | React `useState`/`useEffect` + `localStorage` (favorit) |
| Formulir | `react-hook-form` + `@hookform/resolvers` (dikonfigurasi namun jarang digunakan) |
| Animasi | `motion` (Framer Motion v12) |
| AI | `@google/genai` (dikonfigurasi melalui `GEMINI_API_KEY` env, deklarasi kemampuan di `metadata.json`) |
| Deploy | Next.js `output: 'standalone'` → Docker/Cloud Run; alat Firebase dalam dev deps |

## 🗂 Struktur Proyek

```
zeranime/
├── app/                         # Next.js App Router pages
│   ├── layout.tsx               # Root layout: ThemeProvider, Navbar, Footer, fonts
│   ├── page.tsx                 # Home: staggered Jikan fetches (rate‑limit aware), HorizontalScroller sections
│   ├── globals.css              # Tailwind v4 import only (1 baris)
│   ├── anime/[slug]/            # Anime detail page
│   │   ├── page.tsx             # Server component: getDetail, episodes list, FavoriteButton
│   │   └── FavoriteButton.tsx   # Client component: localStorage favorites toggle
│   ├── episode/[slug]/page.tsx  # Episode page: iframe embed dari animeplay.cfd
│   ├── search/page.tsx          # Search page: getSearch + Pagination
│   ├── schedule/page.tsx        # Weekly schedule per hari (nama hari Indonesia → Jikan)
│   ├── genres/page.tsx          # Genre list page
│   ├── genre/[slug]/page.tsx    # Genre detail page dengan pagination
│   └── favorites/page.tsx       # Client page: menampilkan favorit dari localStorage
├── components/                  # UI komponen bersama
│   ├── AnimeCard.tsx            # Anime card (gambar, judul, badge, overlay play)
│   ├── HorizontalScroller.tsx   # Horizontal scroll section dengan tombol nav
│   ├── Navbar.tsx               # Sticky nav: logo, tautan, pencarian, toggle tema (paksa gelap)
│   ├── Pagination.tsx           # Prev/Next pagination dengan penanganan query string
│   └── theme-provider.tsx       # next-themes wrapper (client component)
├── hooks/
│   └── use-favorites.ts         # localStorage hook (toggle, cek, muat)
├── lib/
│   ├── scraper.ts               # Wrapper API Jikan: fetchJikan, mapAnime, semua fungsi get*
│   └── utils.ts                 # utilitas `cn()` (clsx + tailwind-merge)
├── next.config.ts               # Konfigurasi Next: output standalone, image remotePatterns, flag HMR nonaktif
├── tsconfig.json                # TS strict, path alias @/*, plugin Next.js
├── eslint.config.mjs            # Konfigurasi ESLint flat (extends eslint-config-next)
├── .eslintrc.json               # Konfigurasi lama (digunakan oleh beberapa alat)
├── postcss.config.mjs           # Tailwind v4 + autoprefixer
├── package.json                 # Dependencies & scripts
├── metadata.json                # Metadata aplikasi untuk deploy AI Studio
├── .env.example                 # Placeholder untuk GEMINI_API_KEY & APP_URL
├── .gitignore                   # Standar Next.js ignores
└── README.md                    # <-- Anda sedang membacanya
```

## 🚀 Memulai

### Prasyarat
- Node.js ≥ 20 (disarankan menggunakan versi LTS terbaru)
- npm, yarn, atau pnpm

### Instalasi

```bash
# Clone repositori (jika belum)
git clone https://github.com/svazerID/zeranime.git
cd zeranime

# Install dependensi
npm install   # atau yarn / pnpm install
```

### Variabel Lingkungan

Buat file `.env` di root (meniru `.env.example`):

```env
GEMINI_API_KEY=your_google_gemini_api_key
APP_URL=https://your-deployed-domain.vercel.app   # diisi otomatis oleh Vercel/Cloud Run
```

> **Catatan**: `APP_URL` diisi otomatis oleh platform saat deploy; untuk development dapat dikosongkan atau diisi dengan `http://localhost:3000`.

### Jalankan Pengembangan

```bash
npm run dev   # menjalankan dev server dengan Turbopack (Next 15)
```

Buka <http://localhost:3000> di browser Anda.

### Build untuk Produksi

```bash
npm run build   # menghasilkan output standalone di .next/standalone
npm start       # menjalankan server produksi
```

### Lint

```bash
npm run lint    # menjalankan ESLint dengan konfigurasi flat
```

### Bersihkan Cache Next.js (opsional)

```bash
npm run clean   # menghapus .next dan cache terkait
```

## 📖 Panduan Penggunaan

- **Beranda** menampilkan beberapa section (Ongoing, Popular, Genre‑specific, dsb.) menggunakan horizontal scrollers.
- **Pencarian** (`/cari`) memungkinkan mencari anime berdasarkan judul; hasil ditampilkan dalam grid dengan paginasi.
- **Detail Anime** (`/anime/[slug]`) menampilkan poster, judul, rating, studio, genre, sinopsis, dan daftar episode.
- **Episode** (`/episode/[slug]`) menampilkan iframe pemutar dari `animeplay.cfd` (subtitle Indonesia).
- **Jadwal** (`/jadwal`) menyiarkan jadwal rilis mingguan berdasarkan nama hari Indonesia (Senin, Selasa, …).
- **Genre** (`/genre` dan `/genre/[slug]`) menafsirkan daftar anime per genre.
- **Favorit** (`/favorit`) menyimpan anime yang Anda sukai di `localStorage`; tombol love di halaman detail untuk menambah/mengurangi daftar favorit.

## 🤝 Kontribusi

Kami menyambut kontribusi! Jika ingin memperbaiki bug, menambah fitur, atau meningkatkan dokumentasi:

1. Fork repositori ini.
2. Buat branch fitur: `git checkout -b fitur/nama-fitur`.
3. Lakukan perubahan, lalu commit dengan pesan yang jelasn3. Push ke branch Anda dan buat Pull Request ke `main` repositori upstream.
4. Pastikan kode melewati linter (`npm run lint`) dan tes (jika ada).

> **Catatan**: Proyek saat ini tidak memiliki konfigurasi tes otomatis. Jika Anda ingin menambah uji unit/integrasi, silakan lakukan dan sertakan dalam PR.

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi MIT. Lihat file `LICENSE` (jika ada) untuk detail lebih lanjut.

---

Selamat menikmati anime dengan ZerAnime! 🎌  
Jika ada pertanyaan atau masukan, buka *issue* atau hubungi maintainer.