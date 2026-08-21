import { NextRequest, NextResponse } from 'next/server';

// Proxies upstream images through our own origin so the Next.js image optimizer
// (which fetches server-side from Vercel's egress IP and gets blocked by the
// upstream) and direct <img> loads don't trip IP/referer protections.
const PROXY_BASE = 'https://cors.caliph.my.id/';

function hostAllowed(host: string): boolean {
  return (
    host.endsWith('.sokuja.uk') ||
    host === 'sokuja.id' ||
    host === 'global.nontony.uk' ||
    host === 'storages.sokuja.uk'
  );
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return new NextResponse('Missing url', { status: 400 });

  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return new NextResponse('Invalid protocol', { status: 400 });
  }
  if (!hostAllowed(u.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  const upstreamUrl = isVercel ? `${PROXY_BASE}${u.toString()}` : u.toString();

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8',
        'Referer': 'https://x6.sokuja.uk/',
      },
    });
    if (!upstream.ok) return new NextResponse('Upstream error', { status: 502 });

    const headers = new Headers();
    const ct = upstream.headers.get('content-type');
    if (ct) headers.set('content-type', ct);
    const cl = upstream.headers.get('content-length');
    if (cl) headers.set('content-length', cl);
    headers.set('cache-control', 'public, max-age=86400, immutable');
    headers.set('access-control-allow-origin', '*');

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
