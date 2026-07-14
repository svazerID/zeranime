import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  basePath: string;
}

export function Pagination({ currentPage, hasNext, basePath }: PaginationProps) {
  const prevPage = currentPage > 1 ? currentPage - 1 : 1;
  const nextPage = currentPage + 1;

  // Make sure basePath handles both query strings and paths
  const getUrl = (page: number) => {
    if (basePath.includes('?')) {
      return `${basePath}&page=${page}`;
    }
    return `${basePath}?page=${page}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      {currentPage > 1 ? (
        <Link
          href={getUrl(prevPage)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#0d1015] text-white/60 hover:text-white hover:border-[#a78bfa]/50 transition-colors font-medium text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Link>
      ) : (
        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-full border border-transparent bg-white/5 text-white/20 font-medium text-sm cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
      )}

      <span className="text-sm font-bold text-white/70 min-w-[2.5rem] text-center rounded-full bg-white/5 px-3 py-2 border border-white/10">
        {currentPage}
      </span>

      {hasNext ? (
        <Link
          href={getUrl(nextPage)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#0d1015] text-white/60 hover:text-white hover:border-[#a78bfa]/50 transition-colors font-medium text-sm"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-full border border-transparent bg-white/5 text-white/20 font-medium text-sm cursor-not-allowed">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
