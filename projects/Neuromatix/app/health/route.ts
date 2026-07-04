import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  
  let ollamaConnected = false;
  let models: string[] = [];
  try {
    const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    const r = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      ollamaConnected = true;
      const data = await r.json();
      models = (data.models || []).map((m: any) => m.name);
    }
  } catch {
    /* ignore */
  }

  const responseBody = {
    status: 'stabilized',
    connected: ollamaConnected,
    models: models,
  };

  return NextResponse.json(responseBody, {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}
