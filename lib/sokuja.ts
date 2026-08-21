import { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

let BASE_URL = "https://x6.sokuja.uk/";
let globalProxy: string | null = null;

function setProxy(proxyUrl: string) {
    globalProxy = proxyUrl;
}

function setBaseUrl(url: string) {
    if (url) {
        BASE_URL = url.endsWith('/') ? url : `${url}/`;
    }
}

function generateRandomIP() {
    return [
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255)
    ].join('.');
}

async function fetchPage(url: string, params = {}) {
    const spoofedIp = generateRandomIP();
    
    // Gunakan Web Proxy jika berjalan di environment Vercel
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    const targetUrl = isVercel ? `https://cors.caliph.my.id/${url}` : url;
    
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": BASE_URL,
        "X-Forwarded-For": spoofedIp,
        "X-Real-IP": spoofedIp,
        "Client-IP": spoofedIp,
        "True-Client-IP": spoofedIp,
        "X-Originating-IP": spoofedIp,
        "Forwarded": `for=${spoofedIp}`
    };
    
    const requestConfig: any = {
        headers,
        params,
        timeout: 15000
    };
    
    if (globalProxy) {
        try {
            const parsed = new URL(globalProxy);
            requestConfig.proxy = {
                protocol: parsed.protocol.replace(':', ''),
                host: parsed.hostname,
                port: parseInt(parsed.port)
            };
            if (parsed.username) {
                requestConfig.proxy.auth = {
                    username: parsed.username,
                    password: parsed.password
                };
            }
        } catch (e) {
        }
    }
    
    const response = await axios.get(targetUrl, requestConfig);
    return response.data;
}

function getImgSrc(img: any) {
    if (!img) return '';
    const src = img.attr('src') || '';
    if (src.startsWith('http')) return src;
    if (src.startsWith('/_next/image')) {
        const decoded = decodeURIComponent(src);
        const match = decoded.match(/url=(.*?)&/);
        if (match) return match[1];
    }
    return src;
}

function parseSliderItem($: any, el: any) {
    const card = $(el);
    const link = card.find('a').first();
    const href = link.attr('href') || '';
    const img = card.find('img').first();
    
    const genres: string[] = [];
    card.find('div.mt-2.flex a').each((i: number, ael: any) => {
        genres.push($(ael).text().trim());
    });
    
    const ratingText = card.find('span:contains("★")').text().replace('★', '').trim();
    
    return {
        title: card.find('h3').text().trim(),
        slug: href.replace(/^\/anime\//, '').replace(/\/$/, ''),
        url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
        image: getImgSrc(img),
        genres,
        type: card.find('span').eq(1).text().trim(),
        score: ratingText || null,
        synopsis: card.find('p.mt-2').text().trim()
    };
}

function parseLatestCard($: any, el: any) {
    const card = $(el);
    const href = card.attr('href') || '';
    const img = card.find('img').first();
    
    const epText = card.find('span.absolute.left-2').text().replace('EP', '').trim();
    const typeText = card.find('span.absolute.right-2').text().trim();
    const statusText = card.find('span.absolute.bottom-0').text().trim();
    const metaText = card.find('div.mt-0.5').text().trim();
    const date = metaText.replace(/Episode\s+\d+/i, '').replace(/^[\s·•\-\.]+/g, '').trim();
    
    return {
        title: card.find('h3').text().trim(),
        slug: href.replace(/^\//, '').replace(/\/$/, ''),
        url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
        image: getImgSrc(img),
        episode: epText || null,
        type: typeText || null,
        status: statusText || null,
        date: date || null
    };
}

function parseGridCard($: any, el: any) {
    const card = $(el);
    const href = card.attr('href') || '';
    const img = card.find('img').first();
    
    const typeText = card.find('span.absolute.left-2').text().trim();
    const ratingText = card.find('span.absolute.right-2').text().replace('★', '').trim();
    const statusText = card.find('span.absolute.bottom-0').text().trim();
    
    return {
        title: card.find('h3').text().trim(),
        slug: href.replace(/^\/anime\//, '').replace(/\/$/, ''),
        url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
        image: getImgSrc(img),
        type: typeText || null,
        score: ratingText || null,
        status: statusText || null,
        year: card.find('p.text-xs').text().trim()
    };
}

async function getHomepage() {
    try {
        const html = await fetchPage(BASE_URL);
        const $ = cheerio.load(html);
        
        const slider: any[] = [];
        $('#S\\:0 .snap-center').each((i: number, el: any) => {
            slider.push(parseSliderItem($, el));
        });
        
        const latest: any[] = [];
        $('#S\\:1 a.group').each((i: number, el: any) => {
            latest.push(parseLatestCard($, el));
        });
        
        const ongoing: any[] = [];
        $('#S\\:2 a.group').each((i: number, el: any) => {
            ongoing.push(parseGridCard($, el));
        });
        
        const completed: any[] = [];
        $('#S\\:3 a.group').each((i: number, el: any) => {
            completed.push(parseGridCard($, el));
        });
        
        return { slider, latest, ongoing, completed };
    } catch (error: any) {
        throw new Error(`getHomepage failed: ${error.message}`);
    }
}

async function getLatestEpisodes(page = 1) {
    try {
        const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const episodes: any[] = [];
        $('#S\\:1 a.group').each((i: number, el: any) => {
            episodes.push(parseLatestCard($, el));
        });
        
        return { page: Number(page), episodes };
    } catch (error: any) {
        throw new Error(`getLatestEpisodes failed: ${error.message}`);
    }
}

async function getOngoingAnime(page = 1) {
    try {
        const url = `${BASE_URL}anime/?status=ongoing&order=update&page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const anime: any[] = [];
        $('main .grid a.group').each((i: number, el: any) => {
            anime.push(parseGridCard($, el));
        });
        
        return { page: Number(page), anime };
    } catch (error: any) {
        throw new Error(`getOngoingAnime failed: ${error.message}`);
    }
}

async function getCompletedAnime(page = 1) {
    try {
        const url = `${BASE_URL}anime/?status=completed&order=update&page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const anime: any[] = [];
        $('main .grid a.group').each((i: number, el: any) => {
            anime.push(parseGridCard($, el));
        });
        
        return { page: Number(page), anime };
    } catch (error: any) {
        throw new Error(`getCompletedAnime failed: ${error.message}`);
    }
}

async function getMovieAnime(page = 1) {
    try {
        const url = `${BASE_URL}anime/?type=movie&order=update&page=${page}`;
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const anime: any[] = [];
        $('main .grid a.group').each((i: number, el: any) => {
            anime.push(parseGridCard($, el));
        });
        
        return { page: Number(page), anime };
    } catch (error: any) {
        throw new Error(`getMovieAnime failed: ${error.message}`);
    }
}

async function getAnimeDetails(urlOrSlug: string) {
    try {
        let url = urlOrSlug;
        if (!url.startsWith('http')) {
            const clean = urlOrSlug.replace(/^\/anime\//, '').replace(/^\//, '');
            url = `${BASE_URL}anime/${clean}/`;
        }
        
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const title = $('h1').first().text().replace('Subtitle Indonesia', '').trim();
        const altTitles = $('h1').first().next('p').text().trim();
        
        const posterImg = $('main img').first();
        const image = getImgSrc(posterImg);
        
        const score = $('main span.text-2xl.font-bold').text().trim();
        
        const genres: string[] = [];
        $('main div.flex.flex-wrap.gap-2 a[href^="/genre/"]').each((i: number, el: any) => {
            genres.push($(el).text().trim());
        });
        
        const meta: Record<string, string> = {};
        $('main dl div.flex').each((i: number, el: any) => {
            const key = $(el).find('dt').text().trim();
            const value = $(el).find('dd').text().trim();
            if (key) meta[key] = value;
        });
        
        const synopsis = $('main div.prose.prose-invert').text().trim();
        
        const episodes: any[] = [];
        $('main div.space-y-1 a').each((i: number, el: any) => {
            const href = $(el).attr('href') || '';
            episodes.push({
                title: $(el).find('span').first().text().trim(),
                slug: href.replace(/^\//, '').replace(/\/$/, ''),
                url: href ? `${BASE_URL.replace(/\/$/, '')}${href}` : '',
                date: $(el).find('span').eq(1).text().trim()
            });
        });
        
        return {
            title, altTitles,
            slug: url.replace(/https?:\/\/x6\.sokuja\.uk\/anime\//, '').replace(/\/$/, ''),
            url, image, score, genres, meta, synopsis, episodes
        };
    } catch (error: any) {
        throw new Error(`getAnimeDetails failed: ${error.message}`);
    }
}

async function getEpisodeDetails(urlOrSlug: string) {
    try {
        let url = urlOrSlug;
        if (!url.startsWith('http')) {
            const clean = urlOrSlug.replace(/^\//, '');
            url = `${BASE_URL}${clean}/`;
        }
        
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const title = $('h1').first().text().trim();
        
        const downloads: any[] = [];
        $('main div.rounded-xl.bg-sokuja-card.p-4 a').each((i: number, el: any) => {
            const resolution = $(el).find('span').text().trim();
            downloads.push({
                resolution,
                url: $(el).attr('href') || ''
            });
        });
        
        let episodeId = null;
        let streams: any[] = [];
        
        $('script').each((i: number, el: any) => {
            const content = $(el).html();
            if (content && content.includes('episodeId')) {
                const match = content.match(/\\?"episodeId\\?":\s*(\d+)/);
                if (match) {
                    episodeId = parseInt(match[1]);
                }
            }
        });
        
        if (episodeId) {
            const mirrorsUrl = `${BASE_URL}api/video-mirrors?e=${episodeId}`;
            try {
                const mirrorsRes = await fetchPage(mirrorsUrl);
                if (mirrorsRes && mirrorsRes.mirrors) {
                    streams = mirrorsRes.mirrors.map((m: any) => ({
                        id: m.id,
                        server: m.serverName,
                        url: m.embedUrl,
                        type: m.embedType,
                        quality: m.quality
                    }));
                }
            } catch (e) {
            }
        }
        
        return {
            title,
            slug: url.replace(/https?:\/\/x6\.sokuja\.uk\//, '').replace(/\/$/, ''),
            url, episodeId, streams, downloads
        };
    } catch (error: any) {
        throw new Error(`getEpisodeDetails failed: ${error.message}`);
    }
}

async function search(query: string, page = 1) {
    try {
        const url = BASE_URL;
        const html = await fetchPage(url, { s: query, page });
        const $ = cheerio.load(html);
        
        const anime: any[] = [];
        $('main .grid a.group').each((i: number, el: any) => {
            anime.push(parseGridCard($, el));
        });
        
        return { query, page: Number(page), anime };
    } catch (error: any) {
        throw new Error(`search failed: ${error.message}`);
    }
}

export default async function handler(req: Request, res: Response) {
    try {
        const action = req.query.action as string;
        
        if (!action) {
            return res.status(400).json({
                status: false,
                message: 'Parameter action diperlukan (home, latest, ongoing, completed, movie, search, detail, episode)'
            });
        }

        let result: any = null;
        const page = Number(req.query.page) || 1;

        switch (action) {
            case 'home':
                result = await getHomepage();
                break;
            case 'latest':
                result = await getLatestEpisodes(page);
                break;
            case 'ongoing':
                result = await getOngoingAnime(page);
                break;
            case 'completed':
                result = await getCompletedAnime(page);
                break;
            case 'movie':
                result = await getMovieAnime(page);
                break;
            case 'detail':
                if (!req.query.slug) throw new Error("Parameter slug diperlukan untuk action detail");
                result = await getAnimeDetails(req.query.slug as string);
                break;
            case 'episode':
                if (!req.query.slug) throw new Error("Parameter slug diperlukan untuk action episode");
                result = await getEpisodeDetails(req.query.slug as string);
                break;
            case 'search':
                if (!req.query.query) throw new Error("Parameter query diperlukan untuk action search");
                result = await search(req.query.query as string, page);
                break;
            default:
                return res.status(400).json({
                    status: false,
                    message: `Action ${action} tidak ditemukan`
                });
        }

        res.status(200).json({
            status: true,
            data: result
        });
    } catch (error: any) {
        res.status(500).json({
            status: false,
            message: error.message || 'Terjadi kesalahan'
        });
    }
}
