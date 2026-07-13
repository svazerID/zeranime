'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Moon, Sun, Search, Menu, X, Heart, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Image
                src="/logo.jpg"
                alt="ZerAnime"
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-cover"
                priority
              />
              ZerAnime
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map(link => (
                <Link key={link.name} href={link.href} className="text-white/60 hover:text-white transition-colors">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-[#ff4e00] focus:ring-1 focus:ring-[#ff4e00] focus:outline-none text-sm w-64 transition-all text-[#e0e0e0] placeholder:text-white/30"
              />
              <Search className="w-4 h-4 absolute left-3 text-white/30" />
            </form>

            <Link href="/schedule" className="relative p-2 text-white/60 hover:text-white transition-colors" title="New Episodes">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff4e00] rounded-full border-2 border-transparent shadow shadow-[#ff4e00]/50"></span>
            </Link>

            <button 
              className="p-2 md:hidden text-white/60 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0a] px-4 py-4 space-y-4 shadow-lg pb-6">
           <form onSubmit={handleSearch} className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-md bg-white/5 border border-white/10 focus:border-[#ff4e00] focus:ring-1 focus:ring-[#ff4e00] focus:outline-none text-sm text-[#e0e0e0] placeholder:text-white/30"
              />
              <Search className="w-4 h-4 absolute left-3 text-white/30" />
            </form>
            
          <div className="flex flex-col space-y-2">
            {navLinks.map(link => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
