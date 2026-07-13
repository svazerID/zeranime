'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, CalendarDays, Heart, Search } from 'lucide-react';

const items = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Genres', href: '/genres', icon: LayoutGrid },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Schedule', href: '/schedule', icon: CalendarDays },
  { name: 'Favorites', href: '/favorites', icon: Heart },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#0a0c10] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map(({ name, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active ? 'text-[#ff9d00]' : 'text-white/45'
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={active ? 'text-white' : 'text-white/45'}>{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
