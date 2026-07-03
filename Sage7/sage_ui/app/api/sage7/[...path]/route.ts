import { NextRequest, NextResponse } from 'next/server';

const SAGE7_BASE = 'http://localhost:8001';

async function proxy(req: NextRequest, path: string[]) {
  const joined = path.join('/');
  const search = req.nextUrl.search;
  const url = `${SAGE7_BASE}/api/${joined}${search}`;

  try {
    const res = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}
