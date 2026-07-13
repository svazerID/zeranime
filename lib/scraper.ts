// Otakudesu Scraper (Native Fetch & Regex)
// Zero dependencies, fully Sub Indo

const BASE_URL = 'https://otakudesu.fit';

export interface AnimeItem {
  id: number;
  title: string;
  link: string;
  slug: string;
  poster: string | null;
  status: string | null;
  type: string | null;
  episode: string | null;
  sub: string | null;
  subEpisodes: number;
  dubEpisodes: number;
  totalEpisodes: number;
}

export interface AnimeListResponse {
  items: AnimeItem[];
  currentPage: number;
  hasNext: boolean;
}

function decodeHTML(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
}

function extractAll(regex: RegExp, str: string): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(str)) !== null) results.push(m);
  return results;
}

async function fetchPage(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': BASE_URL
    };
    const response = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    return '';
  }
}

// ── HTML Parsers ──

function parseAnimeListing(html: string): AnimeItem[] {
  const animeList: AnimeItem[] = [];
  
  // Pattern for bsx (Homepage / Ongoing / Complete / Search)
  // Anchor to the <div class="bsx"> card so the lazy matcher can't latch onto
  // an earlier <a href="/"> (site logo/menu), which produced empty slugs.
  const bsRegex = /<div class="bsx">\s*<a href="([^"]+)"[^>]*>[\s\S]*?<span class="epx">([^<]*)<\/span>[\s\S]*?<img src="([^"]+)"[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/g;
  
  let m: RegExpExecArray | null;
  while ((m = bsRegex.exec(html)) !== null) {
    const url = m[1];
    
    // Attempt to extract slug
    // Otakudesu URL patterns:
    // Anime: /anime/slug/
    // Episode: /episode/slug/ (or just /slug/ on homepage)
    let slug = '';
    let link = '';
    const seriesMatch = url.match(/\/(anime|series)\/([^/]+)/);
    if (seriesMatch) {
      slug = seriesMatch[2];
      link = `/anime/${slug}`; // We map /series/ back to our internal /anime/ path
    } else {
      // If it's an episode URL on the homepage, e.g. https://otakudesu.fit/episode-slug/
      // we'll just extract the last path segment as the slug
      const parts = url.split('/').filter(Boolean);
      slug = parts[parts.length - 1];
      if (slug) link = `/episode/${slug}`;
    }

    if (!slug) continue; // Skip invalid links like homepage root "/"
    
    const epStr = m[2].replace(/[^\d]/g, '');
    const epNum = parseInt(epStr) || 0;

    animeList.push({
      id: Math.floor(Math.random() * 100000),
      slug,
      link,
      title: decodeHTML(m[4]).trim(),
      poster: m[3],
      episode: m[2].trim(),
      subEpisodes: epNum,
      dubEpisodes: 0,
      totalEpisodes: epNum,
      type: 'Anime',
      status: null,
      sub: null,
    });
  }

  // Fallback for search page (chivsrc li)
  if (animeList.length === 0) {
    const searchRegex = /<li>[\s\S]*?<img src="([^"]+)"[\s\S]*?<h2><a href="([^"]+)">([^<]+)<\/a><\/h2>[\s\S]*?Status : ([^<]+)<\/div>[\s\S]*?<\/li>/g;
    while ((m = searchRegex.exec(html)) !== null) {
      const url = m[2];
      const seriesMatch = url.match(/\/(anime|series)\/([^/]+)/);
      const slug = seriesMatch ? seriesMatch[2] : '';

      animeList.push({
        id: Math.floor(Math.random() * 100000),
        slug,
        link: `/anime/${slug}`,
        poster: m[1],
        title: decodeHTML(m[3]).trim(),
        status: m[4].trim(),
        episode: null,
        subEpisodes: 0,
        dubEpisodes: 0,
        totalEpisodes: 0,
        type: 'Anime',
        sub: null,
      });
    }
  }

  return animeList;
}

// ── Public API ──

export async function getHome(page: number = 1): Promise<AnimeListResponse> {
  const url = page === 1 ? `${BASE_URL}/ongoing-anime/` : `${BASE_URL}/ongoing-anime/page/${page}/`;
  const html = await fetchPage(url);
  const items = parseAnimeListing(html);
  return { items, currentPage: page, hasNext: items.length > 0 };
}

export async function getNew(page: number = 1): Promise<AnimeListResponse> {
  return getHome(page);
}

export async function getTop(page: number = 1): Promise<AnimeListResponse> {
  // Otakudesu complete anime
  const url = page === 1 ? `${BASE_URL}/complete-anime/` : `${BASE_URL}/complete-anime/page/${page}/`;
  const html = await fetchPage(url);
  const items = parseAnimeListing(html);
  return { items, currentPage: page, hasNext: items.length > 0 };
}

export async function getPopular(page: number = 1): Promise<AnimeListResponse> {
  return getTop(page);
}

// Otakudesu doesn't have upcoming/movies/etc specific API easily accessible without heavy scraping
// We'll fallback to complete for these to avoid empty sections
export async function getUpcoming(page: number = 1): Promise<AnimeListResponse> { return getTop(page); }
export async function getMovies(page: number = 1): Promise<AnimeListResponse> { return getTop(page); }
export async function getAction(page: number = 1): Promise<AnimeListResponse> { return getGenre('action', page); }
export async function getRomance(page: number = 1): Promise<AnimeListResponse> { return getGenre('romance', page); }
export async function getComedy(page: number = 1): Promise<AnimeListResponse> { return getGenre('comedy', page); }
export async function getAdventure(page: number = 1): Promise<AnimeListResponse> { return getGenre('adventure', page); }
export async function getSciFi(page: number = 1): Promise<AnimeListResponse> { return getGenre('sci-fi', page); }
export async function getFantasy(page: number = 1): Promise<AnimeListResponse> { return getGenre('fantasy', page); }

export async function getSearch(query: string, page: number = 1): Promise<AnimeListResponse> {
  // Otakudesu search doesn't use standard /page/N formatting reliably, but we can try
  const html = await fetchPage(`${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`);
  const items = parseAnimeListing(html);
  // We just return items for page 1, next pages for search in Otakudesu are complex
  return { items, currentPage: 1, hasNext: false };
}

export async function getGenresList(): Promise<{ name: string; slug: string; count: number | null }[]> {
  const html = await fetchPage(`${BASE_URL}/`);
  // Match genre links from sidebar: <a href=".../genres/slug/" rel="tag">Name</a>
  const genreMatches = extractAll(/<a[^>]*href="[^"]*\/genres\/([^\/]+)\/"[^>]*>([^<]+)<\/a>/g, html);

  const seen = new Set<string>();
  return genreMatches
    .map(m => ({ slug: m[1], name: m[2], count: null }))
    .filter(g => {
      if (seen.has(g.slug)) return false;
      seen.add(g.slug);
      return true;
    });
}

export async function getGenre(slug: string, page: number = 1): Promise<AnimeListResponse> {
  const url = page === 1 ? `${BASE_URL}/genres/${slug}/` : `${BASE_URL}/genres/${slug}/page/${page}/`;
  const html = await fetchPage(url);
  const items = parseAnimeListing(html);
  return { items, currentPage: page, hasNext: items.length > 0 };
}

export async function getDetail(slug: string) {
  // Use /series/ instead of /anime/
  const html = await fetchPage(`${BASE_URL}/series/${slug}/`);
  
  let title = 'Unknown';
  const titleMatch = html.match(/<h1 class="entry-title"[^>]*>([^<]+)<\/h1>/);
  if (titleMatch) title = decodeHTML(titleMatch[1].trim());

  let poster = null;
  const posterMatch = html.match(/<img[^>]+class="ts-post-image[^>]+src="([^"]+)"/);
  if (posterMatch) poster = posterMatch[1];

  let synopsis = null;
  const synMatch = html.match(/<div class="entry-content"[^>]*>([\s\S]*?)<\/div>/);
  if (synMatch) synopsis = decodeHTML(synMatch[1].replace(/<[^>]+>/g, '').trim());

  let status = null, studio = null, released = null, duration = null, type = null, totalEps = null, rating = null;

  const infoText = html;
  status = (infoText.match(/<b>Status<\/b>\s*:\s*([^<]+)/i) || infoText.match(/Status:\s*([^<]+)/i) || [])[1] || null;
  studio = (infoText.match(/<b>Studio<\/b>\s*:\s*([^<]+)/i) || infoText.match(/Studio:\s*([^<]+)/i) || [])[1] || null;
  released = (infoText.match(/<b>Tanggal Rilis<\/b>\s*:\s*([^<]+)/i) || infoText.match(/Released:\s*([^<]+)/i) || [])[1] || null;
  duration = (infoText.match(/<b>Durasi<\/b>\s*:\s*([^<]+)/i) || infoText.match(/Duration:\s*([^<]+)/i) || [])[1] || null;
  totalEps = (infoText.match(/<b>Total Episode<\/b>\s*:\s*([^<]+)/i) || infoText.match(/Episodes:\s*([^<]+)/i) || [])[1] || null;
  rating = parseFloat((infoText.match(/<b>Skor<\/b>\s*:\s*([0-9.]+)/i) || infoText.match(/Score:\s*([0-9.]+)/i) || [])[1]) || null;

  const genreMatches = extractAll(/<a href="[^"]*\/genres?\/([^/]+)\/">([^<]+)<\/a>/g, html);
  const genres = genreMatches.map(m => ({ slug: m[1], name: m[2].trim() }));

  const episodes: { number: string; title: string; slug: string; date: string | null; hasSub: boolean; hasDub: boolean }[] = [];
  const epListMatch = html.match(/<div class="eplister">([\s\S]*?)<\/ul>/);
  if (epListMatch) {
    const epMatches = extractAll(/<a href="([^"]+)"><div class="epl-num">([^<]+)<\/div><div class="epl-title">([^<]+)<\/div><div class="epl-date">([^<]+)<\/div>/g, epListMatch[1]);
    for (const m of epMatches) {
      if (m[3].toLowerCase().includes('batch')) continue;
      
      const epNum = m[2].trim() || '?';
      const slugMatch = m[1].split('/').filter(Boolean);
      const epSlug = slugMatch[slugMatch.length - 1];
      
      episodes.push({
        number: epNum,
        title: decodeHTML(m[3]).trim(),
        slug: epSlug,
        date: m[4].trim(),
        hasSub: true,
        hasDub: false,
      });
    }
  }

  return {
    slug, title, jpTitle: '', altNames: '', poster, rating, status, studio,
    released, duration, type, totalEps, genres, synopsis,
    episodes, dataId: null
  };
}

export async function getEpisode(slug: string) {
  // Otakudesu episode URLs don't have /episode/
  const html = await fetchPage(`${BASE_URL}/${slug}/`);
  
  let title = 'Episode Not Found';
  const titleMatch = html.match(/<h1 class="entry-title" itemprop="name">([^<]+)<\/h1>/);
  if (titleMatch) title = decodeHTML(titleMatch[1].trim());

  let iframeUrl = null;
  
  // Try to find the primary player embed
  const streamMatch = html.match(/<div class="player-embed"[^>]*>[\s\S]*?<iframe[^>]+src="([^"]+)"/);
  if (streamMatch) {
    iframeUrl = streamMatch[1];
  } else {
    // Check fallback embeds
    const fallbackMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (fallbackMatch) iframeUrl = fallbackMatch[1];
  }

  // Parse episode navigation
  let prevEpisode = null;
  let nextEpisode = null;
  let allEpisodesSlug = '';

  const navMatch = html.match(/<div class="naveps bignav">([\s\S]*?)<\/div>\s*<\/div>/);
  
  function getSlugFromUrl(u: string) {
    const parts = u.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }

  if (navMatch) {
    const navHtml = navMatch[1];
    const prevMatch = navHtml.match(/<a[^>]+href="([^"]+)"[^>]*rel="prev"/);
    if (prevMatch) prevEpisode = getSlugFromUrl(prevMatch[1]);
    
    // Usually next has a similar structure, or just another link
    const links = extractAll(/<a[^>]+href="([^"]+)"/g, navHtml);
    for (const l of links) {
       const url = l[1];
       if (url.includes('/series/')) {
          allEpisodesSlug = getSlugFromUrl(url);
       } else if (url !== (prevMatch ? prevMatch[1] : '')) {
          nextEpisode = getSlugFromUrl(url);
       }
    }
  }

  // Servers
  const servers: { name: string; type: string; linkId: string }[] = [];
  const mirrorMatch = html.match(/<select class="mirror"[^>]*>([\s\S]*?)<\/select>/);
  if (mirrorMatch) {
    const options = extractAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g, mirrorMatch[1]);
    for (const opt of options) {
      if (opt[1] === '') continue; // Skip "Select Video Server"
      
      // value is base64 encoded HTML like <p><iframe src="..."></p>
      let optIframeUrl = null;
      try {
         const decoded = Buffer.from(opt[1], 'base64').toString('utf-8');
         const m = decoded.match(/<iframe[^>]+src="([^"]+)"/);
         if (m) optIframeUrl = m[1];
      } catch (e) {
         // ignore decode error
      }

      if (optIframeUrl) {
         servers.push({
           type: 'sub', // Always sub
           name: decodeHTML(opt[2]).trim() || 'Server',
           linkId: optIframeUrl, // Using the direct URL instead of ID since Manga CMS puts the whole iframe in value
         });
      }
    }
  }

  return {
    title, iframeUrl, videoUrl: null, prevEpisode, nextEpisode,
    allEpisodesSlug, episodeList: [], servers
  };
}

export async function getSchedule(day: string): Promise<AnimeItem[]> {
  const result = await getHome(1); // Return ongoing for schedule
  return result.items;
}
