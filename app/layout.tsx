import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZerAnime',
  description: 'Watch anime full episodes directly.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[#06060b] text-[#e0e0e0] font-sans flex flex-col`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 has-bottom-nav">
            {children}
          </main>
          <footer className="mt-20 relative w-full bg-gradient-to-t from-[#090b0e] to-transparent py-14 has-bottom-nav">
            <div className="absolute inset-0 bg-black/60 z-0"></div>
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">

              <Link href="/" className="brand-gradient inline-block mb-8 text-4xl font-black tracking-tight">
                ZerAnime
              </Link>
              
              <div className="grid grid-cols-2 max-w-[320px] mx-auto gap-y-4 gap-x-12 text-left mb-10 text-[15px] font-medium text-[#e6e6e6]">
                <div className="flex flex-col gap-4 items-start ml-auto">
                  <Link href="/terms" className="hover:text-[#a78bfa] transition-colors">Terms of Service</Link>
                  <Link href="/policy" className="hover:text-[#a78bfa] transition-colors">Policy</Link>
                  <Link href="/faq" className="hover:text-[#a78bfa] transition-colors">FAQs</Link>
                  <Link href="/contact" className="hover:text-[#a78bfa] transition-colors">Contact</Link>
                </div>
                <div className="flex flex-col gap-4 items-start">
                  <Link href="/movies" className="hover:text-[#a78bfa] transition-colors">Movies</Link>
                  <Link href="/tv-shows" className="hover:text-[#a78bfa] transition-colors">Tv shows</Link>
                  <Link href="/ongoing" className="hover:text-[#a78bfa] transition-colors">Animes</Link>
                  <Link href="/favorites" className="hover:text-[#a78bfa] transition-colors">Favorites</Link>
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#7c3aed]/80 to-transparent mb-8"></div>

              <div className="text-[#a9b7c6] space-y-4 text-[15px] leading-relaxed mx-auto max-w-4xl">
                <p>
                  <span className="text-[#a78bfa]">zeranime.vercel.app</span> is top of free streaming website, where to watch anime online free without registration required. 
                  With a big database and great features, we're confident. zeranime.vercel.app is the best free anime online website in the space that you can't simply miss!
                </p>
                <p>
                  This site does not store any files on our server, we only linked to the media which is hosted on 3rd party services.<br/>
                  Powered by SVAZER THE GREAT. All Rights Reserved
                </p>
              </div>
            </div>
          </footer>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
