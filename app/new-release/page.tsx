import { getNew } from '@/lib/scraper';
import { AnimeCard } from '@/components/AnimeCard';
import { Pagination } from '@/components/Pagination';

export default async function NewReleasePage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = searchParams?.page ? parseInt(searchParams.page as string) : 1;

  const { items, currentPage, hasNext } = await getNew(page);

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">New Release</h1>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((anime, i) => (
            <AnimeCard key={`new-release-${anime.slug}-${i}`} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-white/40">
          No anime found.
        </div>
      )}

      {items.length > 0 && (
        <Pagination currentPage={currentPage} hasNext={hasNext} basePath="/new-release" />
      )}
    </div>
  );
}
