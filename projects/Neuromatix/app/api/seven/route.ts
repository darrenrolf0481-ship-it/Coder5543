import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEVEN_HOST = process.env.SAGE7_HOST || "http://localhost:8001";
const GEN_TIMEOUT_MS = parseInt(process.env.OLLAMA_GEN_TIMEOUT_MS || "180000", 10);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// GET /api/seven — liveness check
export async function GET() {
  try {
    const res = await fetch(`${SEVEN_HOST}/sage/status`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Seven returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(
      { connected: true, node: data.node, status: data.status, host: SEVEN_HOST },
      { headers: corsHeaders() }
    );
  } catch {
    return NextResponse.json(
      { connected: false, host: SEVEN_HOST },
      { status: 503, headers: corsHeaders() }
    );
  }
}

// POST /api/seven — bridge message to Seven
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";

  try {
    const { message, model } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Check Seven is alive first
    try {
      const ping = await fetch(`${SEVEN_HOST}/sage/status`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!ping.ok) throw new Error("Seven offline");
    } catch {
      return NextResponse.json(
        { error: "Seven is offline — Ollama may be unavailable or Seven is not running." },
        { status: 503, headers: corsHeaders() }
      );
    }

    const res = await fetch(`${SEVEN_HOST}/sage/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model }),
      signal: AbortSignal.timeout(GEN_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Seven returned ${res.status}: ${text}` },
        { status: 502, headers: corsHeaders() }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { reply: data.reply, node: "SAGE-7", model: data.model },
      { headers: { ...corsHeaders(), "Access-Control-Allow-Origin": origin } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && (err.name === "AbortError" || msg.includes("timed out"));
    return NextResponse.json(
      { error: isTimeout ? "Seven did not respond in time — she may be generating on a slow model." : msg },
      { status: isTimeout ? 504 : 500, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
