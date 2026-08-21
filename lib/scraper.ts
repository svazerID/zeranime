// Sokuja Scraper (x6.sokuja.uk)
// Server-side only. Uses native fetch (Next.js cached) + cheerio.

import * as cheerio from 'cheerio';

const BASE_URL = 'https://x6.sokuja.uk/';
const B = BASE_URL.replace(/\/$/, '');

// Public web proxy used as egress when running on Vercel, whose shared IP range
// gets blocked by the upstream. Locally we hit the source directly.
const PROXY_BASE = 'https://cors.caliph.my.id/';

function generateRandomIP(): string {
  return [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
  ].join('.');
}

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

async function fetchPage(url: string, params: Record<string, string | number> = {}, revalidate = 3600): Promise<string> {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) u.searchParams.set(k, String(v));
  }
  const finalUrl = u.toString();
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  const targetUrl = isVercel ? `${PROXY_BASE}${finalUrl}` : finalUrl;

  const spoofedIp = generateRandomIP();
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': BASE_URL,
        'X-Forwarded-For': spoofedIp,
        'X-Real-IP': spoofedIp,
        'Client-IP': spoofedIp,
        'True-Client-IP': spoofedIp,
        'X-Originating-IP': spoofedIp,
        'Forwarded': `for=${spoofedIp}`,
      },
      next: { revalidate },
    });
    if (!response.ok) return '';
    return await response.text();
  } catch {
    return '';
  }
}

function getImgSrc($img: any): string | null {
  if (!$img || $img.length === 0) return null;
  const src = $img.attr('src') || '';
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/_next/image')) {
    const decoded = decodeURIComponent(src);
    const m = decoded.match(/url=(.*?)&/);
    if (m) return m[1].startsWith('http') ? m[1] : `${B}${m[1]}`;
  }
  if (src.startsWith('/')) return `${B}${src}`;
  return src;
}

function parseCard($: cheerio.CheerioAPI, el: any): AnimeItem {
  const card = $(el);
  const href = card.attr('href') || '';
  const slug = href.replace(/^\/anime\//, '').replace(/^\//, '').replace(/\/$/, '');
  if (!slug) return null as unknown as AnimeItem;

  return {
    id: Math.floor(Math.random() * 100000),
    title: card.find('h3').text().trim(),
    link: `/anime/${slug}`,
    slug,
    poster: getImgSrc(card.find('img').first()),
    // On the listing grid, span.absolute.left-2 holds the type (TV/Movie).
    type: card.find('span.absolute.left-2').text().trim() || null,
    status: card.find('span.absolute.bottom-0').text().trim() || null,
    episode: null,
    sub: null,
    subEpisodes: 0,
    dubEpisodes: 0,
    totalEpisodes: 0,
  };
}

function sortByEpisodeNumber<T extends { slug: string }>(arr: T[]): T[] {
  return arr.sort((a, b) => {
    const na = parseInt((a.slug.match(/episode-(\d+)/i) || [, '0'])[1]) || 0;
    const nb = parseInt((b.slug.match(/episode-(\d+)/i) || [, '0'])[1]) || 0;
    return na - nb;
  });
}

function parseListing(html: string): AnimeItem[] {
  const $ = cheerio.load(html);
  const items: AnimeItem[] = [];
  $('main .grid a.group').each((i, el) => {
    const item = parseCard($, el);
    if (item && item.slug) items.push(item);
  });
  return items;
}

interface ListingParams {
  order?: string;
  status?: string;
  type?: string;
  genre?: string;
  s?: string;
}

async function getListing(params: ListingParams, page: number): Promise<AnimeListResponse> {
  const query: Record<string, string | number> = { page };
  if (params.order) query.order = params.order;
  if (params.status) query.status = params.status;
  if (params.type) query.type = params.type;
  if (params.genre) query.genre = params.genre;
  if (params.s) query.s = params.s;

  const url = params.s ? BASE_URL : `${BASE_URL}anime/`;
  const html = await fetchPage(url, query);
  const items = parseListing(html);
  // ponytail: page size is 24; treat a full page as having a next page.
  return { items, currentPage: page, hasNext: items.length >= 24 };
}

export async function getHome(page: number = 1): Promise<AnimeListResponse> {
  return getListing({ order: 'update' }, page);
}

export async function getNew(page: number = 1): Promise<AnimeListResponse> {
  return getListing({ order: 'latest' }, page);
}

export async function getTop(page: number = 1): Promise<AnimeListResponse> {
  return getListing({ order: 'popular' }, page);
}

export async function getPopular(page: number = 1): Promise<AnimeListResponse> {
  return getTop(page);
}

export async function getUpcoming(page: number = 1): Promise<AnimeListResponse> {
  return getListing({ status: 'upcoming', order: 'update' }, page);
}

export async function getMovies(page: number = 1): Promise<AnimeListResponse> {
  return getListing({ type: 'movie', order: 'update' }, page);
}

export async function getAction(page: number = 1): Promise<AnimeListResponse> { return getGenre('action', page); }
export async function getRomance(page: number = 1): Promise<AnimeListResponse> { return getGenre('romance', page); }
export async function getComedy(page: number = 1): Promise<AnimeListResponse> { return getGenre('comedy', page); }
export async function getAdventure(page: number = 1): Promise<AnimeListResponse> { return getGenre('adventure', page); }
export async function getSciFi(page: number = 1): Promise<AnimeListResponse> { return getGenre('sci-fi', page); }
export async function getFantasy(page: number = 1): Promise<AnimeListResponse> { return getGenre('fantasy', page); }

export async function getSearch(query: string, page: number = 1): Promise<AnimeListResponse> {
  return getListing({ s: query }, page);
}

export async function getGenresList(): Promise<{ name: string; slug: string; count: number | null }[]> {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const genres: { name: string; slug: string; count: number | null }[] = [];
  $('a[href*="/genre/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/\/genre\/([^\/]+)\//);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      genres.push({ slug: m[1], name: $(el).text().trim(), count: null });
    }
  });
  return genres;
}

export async function getGenre(slug: string, page: number = 1): Promise<AnimeListResponse> {
  return getListing({ genre: slug, order: 'update' }, page);
}

export async function getDetail(slug: string) {
  const html = await fetchPage(`${BASE_URL}anime/${slug}/`);
  const $ = cheerio.load(html);

  const title = $('h1').first().text().replace('Subtitle Indonesia', '').trim() || 'Unknown';
  const poster = getImgSrc($('main img').first());

  const scoreText = $('main span.text-2xl.font-bold').text().trim();
  const rating = parseFloat(scoreText) || null;

  const genres: { slug: string; name: string }[] = [];
  $('main div.flex.flex-wrap.gap-2 a[href^="/genre/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/\/genre\/([^\/]+)\//);
    if (m) genres.push({ slug: m[1], name: $(el).text().trim() });
  });

  const meta: Record<string, string> = {};
  $('main dl div.flex').each((i, el) => {
    const k = $(el).find('dt').text().trim().toLowerCase();
    const v = $(el).find('dd').text().trim();
    if (k) meta[k] = v;
  });

  const synopsis = $('main div.prose.prose-invert').text().trim() || null;

  const episodes: { number: string; title: string; slug: string; date: string | null; hasSub: boolean; hasDub: boolean }[] = [];
  $('main div.space-y-1 a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const epSlug = href.replace(/^\//, '').replace(/\/$/, '');
    const titleEp = $(el).find('span').first().text().trim();
    const date = $(el).find('span').eq(1).text().trim();
    const numMatch = epSlug.match(/episode-(\d+)/i) || titleEp.match(/(\d+)/);
    episodes.push({
      number: numMatch ? numMatch[1] : (titleEp || '?'),
      title: titleEp,
      slug: epSlug,
      date: date || null,
      hasSub: true,
      hasDub: false,
    });
  });
  sortByEpisodeNumber(episodes);

  return {
    slug,
    title,
    jpTitle: '',
    altNames: '',
    poster,
    rating: rating ?? (meta['skor'] ? parseFloat(meta['skor']) : null),
    status: meta['status'] || null,
    studio: meta['studio'] || null,
    released: meta['musim'] || meta['rilis'] || meta['released'] || meta['aired'] || null,
    duration: meta['durasi'] || meta['duration'] || null,
    type: meta['tipe'] || meta['type'] || null,
    totalEps: meta['total episode'] || meta['episodes'] || null,
    genres,
    synopsis,
    episodes,
    dataId: null,
  };
}

export async function getEpisode(slug: string) {
  const html = await fetchPage(`${BASE_URL}${slug}/`);
  const $ = cheerio.load(html);

  const title = $('h1').first().text().trim() || 'Episode Not Found';

  // ponytail: episodeId is injected in an inline script; the mirrors API needs it.
  let episodeId: number | null = null;
  $('script').each((i, el) => {
    const c = $(el).html();
    if (c && c.includes('episodeId')) {
      const m = c.match(/\\?"episodeId\\?":\s*(\d+)/);
      if (m) episodeId = parseInt(m[1]);
    }
  });

  let streams: { id: number; server: string; url: string; type: string; quality: string }[] = [];
  if (episodeId) {
    try {
      const mr = await fetchPage(`${BASE_URL}api/video-mirrors?e=${episodeId}`, {}, 600);
      const j = JSON.parse(mr);
      if (j && Array.isArray(j.mirrors)) {
        streams = j.mirrors.map((m: any) => ({
          id: m.id,
          server: m.serverName,
          url: m.embedUrl,
          type: m.embedType,
          quality: m.quality,
        }));
      }
    } catch {
      // mirrors endpoint can fail; fall back to no streams
    }
  }

  const servers = streams.map((s) => ({
    name: s.quality ? `${s.server} (${s.quality})` : s.server,
    type: 'sub',
    linkId: s.url,
  }));
  const iframeUrl = streams.length ? streams[0].url : null;

  // Derive the parent anime slug to build prev/next + the full episode list.
  const animeSlug = slug.replace(/-episode-\d+(?=-subtitle)/i, '') || slug.replace(/-episode-\d+.*$/i, '');
  let allEpisodesSlug = animeSlug;
  let episodeList: { slug: string; title: string; info: string }[] = [];
  let prevEpisode: string | null = null;
  let nextEpisode: string | null = null;

  try {
    const dHtml = await fetchPage(`${BASE_URL}anime/${animeSlug}/`);
    const $d = cheerio.load(dHtml);
    const eps: { slug: string; title: string; info: string }[] = [];
    $d('main div.space-y-1 a').each((i, el) => {
      const href = $d(el).attr('href') || '';
      const s = href.replace(/^\//, '').replace(/\/$/, '');
      eps.push({
        slug: s,
        title: $d(el).find('span').first().text().trim(),
        info: $d(el).find('span').eq(1).text().trim(),
      });
    });
    episodeList = sortByEpisodeNumber(eps);
    const idx = episodeList.findIndex((e) => e.slug === slug);
    if (idx > 0) prevEpisode = episodeList[idx - 1].slug;
    if (idx >= 0 && idx < episodeList.length - 1) nextEpisode = episodeList[idx + 1].slug;
  } catch {
    // detail unavailable; leave navigation empty
  }

  return {
    title,
    iframeUrl,
    videoUrl: null,
    prevEpisode,
    nextEpisode,
    allEpisodesSlug,
    episodeList,
    servers,
  };
}

export async function getSchedule(day: string = ''): Promise<AnimeItem[]> {
  const res = await getListing({ status: 'ongoing', order: 'update' }, 1);
  return res.items;
}
