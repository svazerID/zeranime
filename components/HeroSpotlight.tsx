'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Play, Info, Captions, Mic } from 'lucide-react';
import type { AnimeItem } from '@/lib/scraper';

const resolvePoster = (poster: string | null) => {
  if (!poster) return null;
  if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
  if (poster.startsWith('//')) return `https:${poster}`;
  // fallback for relative paths (should not happen)
  return `https:${poster}`;
};

export function HeroSpotlight({ items }: { items: AnimeItem[] }) {
  const slides = (items || []).filter((a) => a.poster).slice(0, 5);
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (slides.length ? (prev + 1) % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 h-[62vh] min-h-[380px] max-h-[560px]">
      {slides.map((anime, i) => {
        const poster = resolvePoster(anime.poster);
        const isActive = i === active;
        return (
          <div
            key={`${anime.slug}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {poster && (
              <Image
                src={poster}
                alt={anime.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-center"
                referrerPolicy="no-referrer"
              />
            )}
            {/* Gradients for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050608] via-[#050608]/40 to-transparent" />

            <div className="absolute inset-0 flex items-end md:items-center">
              <div className="w-full md:max-w-2xl px-5 md:px-10 pb-8 md:pb-0 space-y-3 md:space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6a00]/15 border border-[#ff6a00]/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#ff9d00]">
                  Spotlight
                </span>
                <h1 className="text-2xl md:text-5xl font-black leading-tight text-white line-clamp-2 drop-shadow-lg">
                  {anime.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-medium text-white/70">
                  <span className="rounded bg-white/10 px-2 py-0.5">{anime.type || 'Anime'}</span>
                  {anime.status && <span className="rounded bg-white/10 px-2 py-0.5">{anime.status}</span>}
                  {anime.subEpisodes > 0 && (
                    <span className="flex items-center gap-1 rounded bg-[#B0E3AF]/20 text-[#B0E3AF] px-2 py-0.5">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#ff9d00] px-5 md:px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#ff6a00]/25 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-black" /> Watch Now
                  </Link>
                  <Link
                    href={anime.link || `/anime/${anime.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 md:px-5 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <Info className="w-4 h-4" /> Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-6 bg-[#ff9d00]' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
