import Image from 'next/image';
import Link from 'next/link';
import { Play, Bookmark, Captions, Mic } from 'lucide-react';
import type { AnimeItem } from '@/lib/scraper';

const resolvePoster = (poster: string | null) => {
  if (!poster) return null;
  if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
  if (poster.startsWith('//')) return `https:${poster}`;
  // fallback for relative paths (should not happen)
  return `https:${poster}`;
};

export function AnimeCard({ anime, rank }: { anime: AnimeItem; rank?: number }) {
  const href = anime.link || `/anime/${anime.slug}`;
  const poster = resolvePoster(anime.poster);

  return (
    <div className="relative flex items-end">
      {typeof rank === 'number' && (
        <span
          className="rank-number shrink-0 -mr-4 md:-mr-6 text-[5.5rem] md:text-[7rem] leading-none select-none"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <Link
        href={href}
        className="xpand group relative block w-full origin-bottom overflow-hidden rounded-xl bg-[#101019] ring-1 ring-white/10"
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          {poster ? (
            <Image
              src={poster}
              alt={anime.title}
              fill
              sizes="(max-width: 768px) 45vw, (max-width: 1200px) 22vw, 190px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
              No Image
            </div>
          )}

          {/* Constant bottom scrim for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Sub / Dub badges */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {anime.subEpisodes > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-[#7c3aed]/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                <Captions className="w-3 h-3" /> {anime.subEpisodes}
              </span>
            )}
            {anime.dubEpisodes > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-[#66c0ff]/90 px-1.5 py-0.5 text-[10px] font-bold text-black backdrop-blur">
                <Mic className="w-3 h-3" /> {anime.dubEpisodes}
              </span>
            )}
          </div>

          {/* Type chip bottom-left, always visible */}
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
            {anime.type || 'Anime'}
          </span>
        </div>

        {/* Title (always visible) */}
        <div className="px-2.5 pt-2 pb-2.5">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#f0f0f0] transition-colors group-hover:text-[#a78bfa]">
            {anime.title}
          </h3>
        </div>

        {/* Hover-expand drawer (desktop only via CSS) */}
        <div className="xpand-drawer px-2.5">
          <div className="xpand-drawer-inner">
            <div className="flex items-center gap-2 pb-3 pt-0.5">
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] py-1.5 text-xs font-bold text-white">
                <Play className="w-3.5 h-3.5 fill-white" /> Watch
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/70">
                <Bookmark className="w-3.5 h-3.5" />
              </span>
            </div>
            {(anime.episode || anime.status) && (
              <p className="pb-2.5 text-[11px] font-medium text-white/45">
                {anime.episode || anime.status}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
