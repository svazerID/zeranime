'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Genres', href: '/genres' },
    { name: 'Schedule', href: '/schedule' },
    { name: 'Favorites', href: '/favorites' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0c10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.jpg"
                alt="ZerAnime"
                width={40}
                height={40}
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-[#ff9d00]/40 transition-all"
                priority
              />
              <span className="brand-gradient text-xl md:text-2xl font-black tracking-tight">ZerAnime</span>
            </Link>

            <div className="hidden md:flex items-center gap-1 text-sm font-medium">
              {navLinks.map(link => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative px-3 py-2 rounded-lg transition-colors ${
                      active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                    {active && (
                      <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#ff6a00] to-[#ff9d00]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
              <input
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-[#ff9d00] focus:ring-1 focus:ring-[#ff9d00] focus:outline-none text-sm w-64 transition-all text-[#e0e0e0] placeholder:text-white/30"
              />
              <Search className="w-4 h-4 absolute left-3 text-white/30" />
            </form>

            <Link href="/schedule" className="relative p-2 text-white/60 hover:text-white transition-colors" title="New Episodes">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff6a00] rounded-full shadow shadow-[#ff6a00]/50"></span>
            </Link>

            <button
              className="p-2 md:hidden text-white/60 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0c10] px-4 py-4 space-y-4 shadow-lg pb-6">
           <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full rounded-xl bg-white/5 border border-white/10 focus:border-[#ff9d00] focus:ring-1 focus:ring-[#ff9d00] focus:outline-none text-sm text-[#e0e0e0] placeholder:text-white/30"
              />
              <Search className="w-4 h-4 absolute left-3 text-white/30" />
            </form>

          <div className="flex flex-col space-y-1">
            {navLinks.map(link => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl font-medium transition-colors ${
                    active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
