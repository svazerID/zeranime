'use client';

import { useState, useEffect } from 'react';
import { Server, Captions, Mic, AlertCircle } from 'lucide-react';

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

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Video Player Section */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-slate-800">
        {activeIframe ? (
          <iframe
            src={activeIframe}
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
                     ? 'border-[#ff9d00]/50 bg-[#ff9d00]/10 text-[#ff9d00]'
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
