import { Suspense } from 'react';
import SearchClient from './SearchClient';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-white/40">Memuat...</p>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}