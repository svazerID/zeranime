'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

export function HorizontalScroller({
  title,
  viewAllHref,
  children
}: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 md:h-6 rounded-full bg-gradient-to-b from-[#7c3aed] to-[#a78bfa]" />
            {title}
          </h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-xs md:text-sm text-white/40 font-medium hover:text-[#a78bfa] transition-colors">
              View All
            </Link>
          )}
        </div>
        <div className="hidden sm:flex gap-2">
          <button onClick={scrollLeft} aria-label="Scroll left" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#a78bfa]/40 active:scale-90 transition-all">
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          <button onClick={scrollRight} aria-label="Scroll right" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#a78bfa]/40 active:scale-90 transition-all">
            <ChevronRight className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar"
      >
        {children}
      </div>
    </div>
  );
}
