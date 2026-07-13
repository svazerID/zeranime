'use client';

import { getSearch } from '@/lib/scraper';
import { AnimeCard } from '@/components/AnimeCard';
import { Pagination } from '@/components/Pagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const q = searchParams.get('q') || '';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
  const [inputValue, setInputValue] = useState(q);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (query) {
      const params = new URLSearchParams();
      params.set('q', query);
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-full max-w-xl">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder="Cari anime..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-full bg-white/5 border border-white/10 focus:border-[#ff9d00] focus:ring-1 focus:ring-[#ff9d00] focus:outline-none text-sm w-full transition-all text-[#e0e0e0] placeholder:text-white/30"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-4 pt-[2.5px] text-white/60 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
          <p className="mt-4 text-white/40 text-center text-sm">
            Masukkan judul anime untuk mulai mencari
          </p>
        </div>
      </div>
    );
  }

  // Fetch search results
  const { items, currentPage, hasNext } = await getSearch(q, page);

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Hasil pencarian untuk "{q}"</h1>
        <p className="text-white/40 text-sm mt-1">Ditemukan {items.length} anime di halaman {currentPage}</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((anime, i) => (
            <AnimeCard key={`search-${anime.slug}-${i}`} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-white/40">
          Tidak ada anime yang cocok dengan pencarian Anda.
        </div>
      )}

      {items.length > 0 && (
        <Pagination currentPage={currentPage} hasNext={hasNext} basePath={`/search?q=${encodeURIComponent(q)}`} />
      )}
    </div>
  );
}