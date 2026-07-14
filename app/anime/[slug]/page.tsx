import { getDetail } from '@/lib/scraper';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Calendar, CheckCircle, Captions, Mic } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

export default async function AnimeDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;
  const anime = await getDetail(slug);

  if (!anime.title || anime.title === 'Unknown') {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Anime Not Found</h1>
        <p className="text-slate-500 mt-2">The anime you requested could not be loaded.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 max-w-xs mx-auto md:mx-0 shrink-0">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-lg border border-white/10 bg-neutral-800">
            {anime.poster ? (
              <Image 
                src={anime.poster.startsWith('http') ? anime.poster : `https:${anime.poster}`} 
                alt={anime.title} 
                fill 
                className="object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white/30">No Image</div>}
          </div>
          <div className="mt-4 flex gap-2">
            <FavoriteButton anime={{ slug: anime.slug, title: anime.title, poster: anime.poster }} />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">{anime.title}</h1>
            {anime.jpTitle && (
              <p className="text-sm text-white/40 mb-1 italic">{anime.jpTitle}</p>
            )}
            {anime.altNames && (
              <p className="text-xs text-white/30 mb-3">{anime.altNames}</p>
            )}
            <div className="flex flex-wrap gap-3 items-center text-sm font-medium text-white/60">
              {anime.rating && (
                <div className="flex items-center gap-1 text-[#a78bfa] bg-[#a78bfa]/10 px-2 py-0.5 rounded">
                  <Star className="w-4 h-4 fill-[#a78bfa]" /> {anime.rating}
                </div>
              )}
              {anime.status && (
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white text-xs tracking-widest uppercase">
                   {anime.status}
                </div>
              )}
              {anime.duration && (
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                  <Clock className="w-4 h-4 text-white/60" /> {anime.duration}
                </div>
              )}
              {anime.released && (
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                  <Calendar className="w-4 h-4 text-white/60" /> {anime.released}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {anime.genres.map((g: {slug: string, name: string}) => (
              <Link key={g.slug} href={`/genre/${g.slug}`} className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                {g.name}
              </Link>
            ))}
          </div>

          {anime.synopsis && (
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                {anime.synopsis}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            {anime.type && <div><span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Type</span><span className="font-bold text-white">{anime.type}</span></div>}
            {anime.studio && <div><span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Studio</span><span className="font-bold text-white">{anime.studio}</span></div>}
            {anime.totalEps && <div><span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Episodes</span><span className="font-bold text-white">{anime.totalEps}</span></div>}
          </div>
        </div>
      </div>

      {/* Episode List */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
           Episodes <span className="text-sm font-normal text-white/40">({anime.episodes.length})</span>
        </h3>
        {anime.episodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {anime.episodes.map(ep => (
              <Link
                key={ep.slug}
                href={`/episode/${ep.slug}`}
                className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-[#0d1015] hover:border-[#a78bfa]/50 transition-all group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-white/60 font-bold group-hover:bg-gradient-to-br group-hover:from-[#7c3aed] group-hover:to-[#a78bfa] group-hover:text-white transition-colors">
                  {ep.number || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-[#a78bfa] transition-colors">
                    {ep.title || `Episode ${ep.number}`}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {ep.hasSub && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#B0E3AF]">
                        <Captions className="w-3 h-3" /> SUB
                      </span>
                    )}
                    {ep.hasDub && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#66c0ff]">
                        <Mic className="w-3 h-3" /> DUB
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
           <div className="text-center py-10 text-white/40 border border-white/10 rounded-xl bg-white/5">
             No episodes available yet.
           </div>
        )}
      </div>
    </div>
  );
}
