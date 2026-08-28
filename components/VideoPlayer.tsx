'use client';

import { useState, useEffect } from 'react';
import { Server, Captions, Mic, AlertCircle } from 'lucide-react';

// Stream directly from the upstream CDN. The CDN (storages.sokuja.uk /
// global.nontony.uk) only returns 403 when it sees a foreign Referer, so a
// no-referrer <video>/<iframe> plays fine — and costs ZERO Vercel bandwidth.
// (The old /api/video proxy burned ~21 GB of Fast Data Transfer in 12 hours.)
const directVideo = (url: string | null) => url;

export default function VideoPlayer({
  defaultIframe,
  servers
}: {
  defaultIframe: string | null;
  servers: { name: string; type: string; linkId: string }[]
}) {
  const [activeIframe, setActiveIframe] = useState<string | null>(defaultIframe);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // If defaultIframe is blocked or null, fallback to the first server's iframe if available
  useEffect(() => {
    if (!activeIframe && servers && servers.length > 0) {
      setActiveIframe(servers[0].linkId);
      setActiveIndex(0);
    }
  }, [activeIframe, servers]);

  const isVideoFile = (url: string | null) =>
    !!url && /\.(mp4|webm|m3u8|mov|ogg)(\?|#|$)/i.test(url);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Video Player Section */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-slate-800">
        {activeIframe && isVideoFile(activeIframe) ? (
          <video
            src={directVideo(activeIframe)!}
            controls
            autoPlay
            referrerPolicy="no-referrer"
            className="w-full h-full border-0 absolute inset-0 bg-black"
          />
        ) : activeIframe ? (
          <iframe
            src={directVideo(activeIframe)!}
            allowFullScreen
            className="w-full h-full border-0 absolute inset-0"
            referrerPolicy="no-referrer"
          ></iframe>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
             <AlertCircle className="w-12 h-12 text-slate-600" />
             <p>No video player found for this episode.</p>
          </div>
        )}
      </div>

      {/* Server Info */}
      {servers && servers.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Server className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/40 font-medium mr-2">Available Servers:</span>
          {servers.map((srv, i) => {
             const isActive = activeIframe === srv.linkId;
             return (
               <button
                 key={`${srv.type}-${srv.name}-${i}`}
                 onClick={() => {
                   setActiveIframe(srv.linkId);
                   setActiveIndex(i);
                 }}
                 className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                   isActive
                     ? 'border-[#a78bfa]/50 bg-[#a78bfa]/10 text-[#a78bfa]'
                     : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                 }`}
               >
                 {srv.type === 'sub' ? <Captions className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                 {srv.name}
                 <span className="text-[9px] uppercase opacity-60 ml-0.5">{srv.type}</span>
               </button>
             );
          })}
        </div>
      )}
    </div>
  );
}
