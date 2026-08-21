import { getSchedule } from '@/lib/scraper';
import { AnimeCard } from '@/components/AnimeCard';
import { Calendar } from 'lucide-react';

export const revalidate = 3600;

export default async function SchedulePage() {
  const anime = await getSchedule('');

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <Calendar className="w-8 h-8 text-[#a78bfa]" />
        <div>
           <h1 className="text-3xl font-bold text-white">Currently Airing</h1>
           <p className="text-white/40">Anime that are currently airing this season.</p>
        </div>
      </div>

      {anime.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {anime.map((item, i) => (
            <AnimeCard key={`airing-${item.slug}-${i}`} anime={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-white/40">
           No currently airing anime found.
        </div>
      )}
    </div>
  );
}
