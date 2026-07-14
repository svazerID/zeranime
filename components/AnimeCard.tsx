import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle, Bookmark, Captions, Mic } from 'lucide-react';
import type { AnimeItem } from '@/lib/scraper';

const resolvePoster = (poster: string | null) => {
  if (!poster) return null;
  if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
  if (poster.startsWith('//')) return `https:${poster}`;
  // fallback for relative paths (should not happen)
  return `https:${poster}`;
};

export function AnimeCard({ anime }: { anime: AnimeItem }) {
  return (
    <Link href={anime.link || `/anime/${anime.slug}`} className="group relative flex flex-col gap-2 transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-[#a78bfa]/50 group-hover:shadow-xl group-hover:shadow-[#7c3aed]/20">
        {anime.poster ? (
          <Image
            src={resolvePoster(anime.poster)!}
            alt={anime.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
            No Image
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
             <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#7c3aed]/90 backdrop-blur scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-[#7c3aed]/40">
               <PlayCircle className="w-7 h-7 text-white" />
             </span>
        </div>

        {/* Top left Bookmark */}
        <div className="absolute top-2 left-2 flex items-center justify-center w-7 h-7 bg-black/50 backdrop-blur rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
           <Bookmark className="w-4 h-4 text-white" />
        </div>

        {/* Top right Badge - Sub/Dub info */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {anime.subEpisodes > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#B0E3AF]/90 backdrop-blur text-[10px] text-black font-bold rounded-md">
              <Captions className="w-3 h-3" /> {anime.subEpisodes}
            </span>
          )}
          {anime.dubEpisodes > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#66c0ff]/90 backdrop-blur text-[10px] text-black font-bold rounded-md">
              <Mic className="w-3 h-3" /> {anime.dubEpisodes}
            </span>
          )}
        </div>

        {/* Bottom meta on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <div className="flex justify-between items-center text-[11px] w-full text-white font-medium">
                 <span className="truncate rounded bg-black/40 backdrop-blur px-1.5 py-0.5">{anime.type || 'Anime'}</span>
                 {anime.totalEpisodes > 0 && <span className="text-[#a78bfa] ml-2 shrink-0 rounded bg-black/40 backdrop-blur px-1.5 py-0.5">{anime.totalEpisodes} eps</span>}
             </div>
        </div>
      </div>
      <div className="px-0.5 mt-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-[#f0f0f0] group-hover:text-[#a78bfa] transition-colors leading-snug">
          {anime.title}
        </h3>
        <p className="text-xs text-white/40 mt-0.5 truncate font-medium">
          {anime.type || 'Anime'}
        </p>
      </div>
    </Link>
  );
}
