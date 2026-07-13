import { getEpisode } from '@/lib/scraper';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

export default async function EpisodePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;
  const episode = await getEpisode(slug);

  if (!episode.title) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Episode Not Found</h1>
        <p className="text-slate-500 mt-2">The episode you requested could not be loaded.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{episode.title}</h1>
        </div>
        {episode.allEpisodesSlug && (
          <Link 
            href={`/anime/${episode.allEpisodesSlug}`}
            className="flex items-center gap-2 text-sm font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-xl transition-colors shadow-lg"
          >
            <List className="w-4 h-4" /> All Episodes
          </Link>
        )}
      </div>

      <VideoPlayer 
        defaultIframe={episode.iframeUrl} 
        servers={episode.servers} 
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
        {episode.prevEpisode ? (
          <Link 
            href={`/episode/${episode.prevEpisode}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors font-bold text-sm border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Prev Episode
          </Link>
        ) : (
          <div className="w-[120px]"></div>
        )}

        {episode.nextEpisode ? (
          <Link
            href={`/episode/${episode.nextEpisode}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#ff9d00] text-black hover:brightness-110 transition-all font-bold text-sm shadow-lg shadow-[#ff6a00]/20"
          >
            Next Episode <ChevronRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>

      {/* Episode List (Grid) */}
      {episode.episodeList && episode.episodeList.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-white">Other Episodes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {episode.episodeList.map((ep: {slug: string, title: string, info: string}) => (
              <Link 
                key={ep.slug} 
                href={`/episode/${ep.slug}`}
                className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                  ep.slug === slug
                  ? 'border-[#ff9d00] bg-[#ff9d00]/10 text-[#ff9d00]'
                  : 'border-white/10 bg-[#0d1015] hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                <div className="truncate">{ep.title}</div>
                {ep.info && <div className="text-xs text-white/40 mt-1">{ep.info}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
