'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Globe, Loader2, X, Settings, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpisodeData {
  title: string;
  iframeUrl: string | null;
  videoUrl: string | null;
  prevEpisode: string | null;
  nextEpisode: string | null;
  allEpisodesSlug: string | null;
  episodeList: { slug: string; title: string; info: string }[];
}

interface SubtitleTrack {
  label: string;
  src: string;
  srclang: string;
  default?: boolean;
}

interface EpisodePlayerProps {
  episode: EpisodeData;
  slug: string;
}

function parseSRT(srt: string): { start: number; end: number; text: string }[] {
  const cues: { start: number; end: number; text: string }[] = [];
  const blocks = srt.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;
    
    const parseTime = (t: string) => {
      const [h, m, s] = t.split(':');
      const [sec, ms] = s.split(',');
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec) + parseInt(ms) / 1000;
    };
    
    cues.push({
      start: parseTime(timeMatch[1]),
      end: parseTime(timeMatch[2]),
      text: lines.slice(2).join('\n')
    });
  }
  return cues;
}

async function fetchSubtitles(animeTitle: string, episodeNum: number): Promise<SubtitleTrack[]> {
  try {
    // Try Indonesian subtitles first
    const searchUrl = `https://kitsunekko.net/dirlist.php?dir=subtitles/indonesian/${encodeURIComponent(animeTitle)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    const epPattern = new RegExp(`href="([^"]*[Ee]p?isode?[._-]?${episodeNum}[^"]*\\.(?:srt|vtt|ass))"`, 'gi');
    const matches = [...html.matchAll(epPattern)];
    
    if (matches.length > 0) {
      return matches.slice(0, 3).map((m, i) => ({
        label: `Indonesian ${i + 1}`,
        src: `https://kitsunekko.net/${m[1]}`,
        srclang: 'id',
        default: i === 0
      }));
    }
    
    // Fallback: English subtitles
    const enSearchUrl = `https://kitsunekko.net/dirlist.php?dir=subtitles/english/${encodeURIComponent(animeTitle)}`;
    const enResponse = await fetch(enSearchUrl);
    const enHtml = await enResponse.text();
    const enMatches = [...enHtml.matchAll(new RegExp(`href="([^"]*[Ee]p?isode?[._-]?${episodeNum}[^"]*\\.(?:srt|vtt|ass))"`, 'gi'))];
    
    if (enMatches.length > 0) {
      return enMatches.slice(0, 2).map((m, i) => ({
        label: `English ${i + 1}`,
        src: `https://kitsunekko.net/${m[1]}`,
        srclang: 'en',
        default: i === 0
      }));
    }
  } catch (e) {
    console.warn('Subtitle fetch failed:', e);
  }
  return [];
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function EpisodePlayer({ episode, slug }: EpisodePlayerProps) {
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<SubtitleTrack | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [currentCue, setCurrentCue] = useState<string>('');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [animeTitle, setAnimeTitle] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Extract anime title from episode title
  useEffect(() => {
    const match = episode.title.match(/^(.+?)\s*-\s*Episode/);
    if (match) setAnimeTitle(match[1].trim());
  }, [episode.title]);

  // Extract episode number from slug
  const epNumMatch = slug.match(/-episode-(\d+)/);
  const episodeNum = epNumMatch ? parseInt(epNumMatch[1]) : 1;

  // Fetch subtitles
  const loadSubtitles = useCallback(async () => {
    if (!animeTitle || isLoadingSubs) return;
    setIsLoadingSubs(true);
    setDownloadError(null);
    try {
      const tracks = await fetchSubtitles(animeTitle, episodeNum);
      setSubtitles(tracks);
      if (tracks.length > 0) {
        setActiveSubtitle(tracks[0]);
        const res = await fetch(tracks[0].src);
        const text = await res.text();
        setSubtitleCues(parseSRT(text));
      }
    } catch (e) {
      console.error('Failed to load subtitles:', e);
      setDownloadError('Failed to fetch subtitles');
    } finally {
      setIsLoadingSubs(false);
    }
  }, [animeTitle, episodeNum, isLoadingSubs]);

  useEffect(() => {
    loadSubtitles();
  }, [loadSubtitles]);

  const toggleSubtitle = (track: SubtitleTrack) => {
    setActiveSubtitle(track);
    setShowSubtitleMenu(false);
    fetch(track.src).then(r => r.text()).then(text => {
      setSubtitleCues(parseSRT(text));
    });
  };

  const handleDownloadSubtitle = async (src: string, label: string) => {
    try {
      setDownloadError(null);
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${animeTitle.replace(/\s+/g, '-')}-ep${episodeNum}-${label}.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError('Download failed');
      console.error('Download failed:', e);
    }
  };

  return (
    <div className="relative">
      {/* Video Player Container */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-slate-800">
        {episode.iframeUrl ? (
          <iframe
            src={episode.iframeUrl}
            allowFullScreen
            className="w-full h-full border-0 absolute inset-0"
            title="Video Player"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          ></iframe>
        ) : episode.videoUrl ? (
          <video
            src={episode.videoUrl}
            controls
            className="w-full h-full outline-none"
            controlsList="nodownload"
          ></video>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-600" />
            <p>No video player found for this episode.</p>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Subtitle Selector & Download */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium',
                  'hover:bg-white/20 transition-colors disabled:opacity-50'
                )}
                disabled={subtitles.length === 0 && !isLoadingSubs}
              >
                <Globe className="w-4 h-4" />
                <span>{activeSubtitle?.label || (isLoadingSubs ? 'Loading...' : 'No Subtitles')}</span>
                {isLoadingSubs && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>

              {showSubtitleMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-slide-up z-30">
                  {subtitles.map((track) => (
                    <div key={track.src} className="flex items-center justify-between p-2">
                      <button
                        onClick={() => toggleSubtitle(track)}
                        className={cn(
                          'flex-1 text-left text-sm transition-colors',
                          activeSubtitle?.src === track.src
                            ? 'text-orange-400 font-bold'
                            : 'text-white/80 hover:text-white'
                        )}
                      >
                        {track.label}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSubtitle(track.src, track.label);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title={`Download ${track.label} subtitle`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {subtitles.length === 0 && !isLoadingSubs && (
                    <div className="px-4 py-3 text-center text-slate-500 text-sm">
                      No subtitles found for this episode
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Episode Title */}
            <div className="flex-1 text-center text-white font-medium truncate px-4">
              {episode.title}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Subtitle Controls (iframe doesn't expose playback time) */}
      {activeSubtitle && subtitleCues.length > 0 && (
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" /> Subtitle Overlay (Manual Sync)
            </h4>
            <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
              iframe doesn't expose playback time — use Prev/Next buttons
            </span>
            {downloadError && (
              <span className="text-xs text-red-400 bg-red-600/20 px-2 py-0.5 rounded">
                {downloadError}
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const currentIdx = subtitleCues.findIndex(c => c.text === currentCue);
                  if (currentIdx > 0) setCurrentCue(subtitleCues[currentIdx - 1].text);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => {
                  const currentIdx = subtitleCues.findIndex(c => c.text === currentCue);
                  if (currentIdx < subtitleCues.length - 1) setCurrentCue(subtitleCues[currentIdx + 1].text);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentCue('')}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Hide
              </button>
              <button
                onClick={() => handleDownloadSubtitle(activeSubtitle.src, activeSubtitle.label)}
                className="ml-auto px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download .srt
              </button>
            </div>

            {/* Cue List */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {subtitleCues.slice(0, 50).map((cue, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentCue(cue.text)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm rounded-lg transition-colors border border-transparent',
                    currentCue === cue.text
                      ? 'bg-orange-600/30 border-orange-600/50 text-orange-300 font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{cue.text}</span>
                    <span className="text-xs text-slate-400 ml-2 shrink-0">
                      {formatTime(cue.start)} - {formatTime(cue.end)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </div>
  );
}