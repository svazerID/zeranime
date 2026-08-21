'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBox({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = value.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <input
        type="text"
        placeholder="Cari anime..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 pr-4 py-3 rounded-full bg-white/5 border border-white/10 focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa] focus:outline-none text-sm w-full transition-all text-[#e0e0e0] placeholder:text-white/30"
      />
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
    </form>
  );
}