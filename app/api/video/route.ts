import { NextRequest, NextResponse } from 'next/server';

// Stream via our own origin to inject the required Referer header.
// The CDN (storages.sokuja.uk) returns 404 if no Referer is sent,
// and 403 if the Referer is foreign. It ONLY serves content when
// Referer matches x6.sokuja.uk.
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

  // ALWAYS route through the cors proxy — both Vercel AND Cloudflare egress
  // IPs are blocked by the upstream CDN, so a direct fetch always fails.
  const upstreamUrl = `${PROXY_BASE}${u.toString()}`;

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    // CRITICAL: Spoof referer to match the source site
    'Referer': 'https://x6.sokuja.uk/',
  };
  const range = req.headers.get('range');
  if (range) headers['Range'] = range;

  try {
    const upstream = await fetch(upstreamUrl, { headers });
    if (!upstream.ok) return new NextResponse('Upstream error', { status: 502 });

    const out = new Headers();
    const ct = upstream.headers.get('content-type');
    if (ct) out.set('content-type', ct);
    const cl = upstream.headers.get('content-length');
    if (cl) out.set('content-length', cl);
    const cr = upstream.headers.get('content-range');
    if (cr) out.set('content-range', cr);
    const ar = upstream.headers.get('accept-ranges');
    if (ar) out.set('accept-ranges', ar);
    out.set('cache-control', 'public, max-age=86400');
    out.set('access-control-allow-origin', '*');

    return new NextResponse(upstream.body, { status: upstream.status, headers: out });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
