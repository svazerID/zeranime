'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Play, Info, Captions, Mic, Flame } from 'lucide-react';
import type { AnimeItem } from '@/lib/scraper';

const resolvePoster = (poster: string | null) => {
  if (!poster) return null;
  if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
  if (poster.startsWith('//')) return `https:${poster}`;
  // fallback for relative paths (should not happen)
  return `https:${poster}`;
};

export function HeroSpotlight({ items }: { items: AnimeItem[] }) {
  const slides = (items || []).filter((a) => a.poster).slice(0, 6);
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (slides.length ? (prev + 1) % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6500);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 h-[68vh] min-h-[440px] max-h-[620px]">
      {/* Background slides */}
      {slides.map((anime, i) => {
        const poster = resolvePoster(anime.poster);
        const isActive = i === active;
        return (
          <div
            key={`bg-${anime.slug}-${i}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {poster && (
              <Image
                src={poster}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={`object-cover object-center ${isActive ? 'animate-kenburns' : ''}`}
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06060b] via-[#06060b]/60 to-[#06060b]/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06060b] via-[#06060b]/50 to-transparent" />
          </div>
        );
      })}

      {/* Foreground content for the active slide */}
      {slides.map((anime, i) => {
        if (i !== active) return null;
        return (
          <div key={`fg-${anime.slug}-${i}`} className="absolute inset-0 flex items-end md:items-center z-10">
            <div className="w-full md:max-w-2xl px-5 md:px-12 pb-24 md:pb-0 space-y-3 md:space-y-5 animate-fade-in-up">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#c084fc]">
                <Flame className="w-3.5 h-3.5" /> #{i + 1} Spotlight
              </span>
              <h1 className="text-3xl md:text-6xl font-black leading-[1.05] text-white line-clamp-2 drop-shadow-xl">
                {anime.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-medium text-white/70">
                <span className="rounded bg-white/10 px-2 py-0.5">{anime.type || 'Anime'}</span>
                {anime.status && <span className="rounded bg-white/10 px-2 py-0.5">{anime.status}</span>}
                {anime.subEpisodes > 0 && (
                  <span className="flex items-center gap-1 rounded bg-[#7c3aed]/20 text-[#c084fc] px-2 py-0.5">
                    <Captions className="w-3.5 h-3.5" /> {anime.subEpisodes}
                  </span>
                )}
                {anime.dubEpisodes > 0 && (
                  <span className="flex items-center gap-1 rounded bg-[#66c0ff]/20 text-[#66c0ff] px-2 py-0.5">
                    <Mic className="w-3.5 h-3.5" /> {anime.dubEpisodes}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href={anime.link || `/anime/${anime.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] px-6 md:px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" /> Watch Now
                </Link>
                <Link
                  href={anime.link || `/anime/${anime.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Info className="w-4 h-4" /> Details
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Thumbnail rail */}
      <div className="absolute bottom-3 md:bottom-5 right-3 md:right-8 left-3 md:left-auto z-20 flex items-center gap-2 md:gap-2.5 overflow-x-auto no-scrollbar md:justify-end">
        {slides.map((anime, i) => {
          const poster = resolvePoster(anime.poster);
          const isActive = i === active;
          return (
            <button
              key={`th-${anime.slug}-${i}`}
              aria-label={`Slide ${i + 1}: ${anime.title}`}
              onClick={() => setActive(i)}
              className={`relative shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
                isActive
                  ? 'w-14 h-20 md:w-16 md:h-24 ring-2 ring-[#a78bfa]'
                  : 'w-10 h-14 md:w-12 md:h-16 ring-1 ring-white/15 opacity-60 hover:opacity-100'
              }`}
            >
              {poster && (
                <Image src={poster} alt="" fill sizes="64px" className="object-cover" referrerPolicy="no-referrer" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
