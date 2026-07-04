import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  
  try {
    const { message, model, containerTag } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { 
        status: 400,
        headers: { "Access-Control-Allow-Origin": origin }
      });
    }

    let systemInstruction = "You are Neuromatix, a state-of-the-art developer agent. You are communicating with Merlin and SAGE/MAMA via the bridge.\n";
    if (containerTag) {
      systemInstruction += `Active Memory Container Tag: ${containerTag}\n`;
    }

    // Determine LLM provider (Ollama vs OpenRouter)
    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    let useOllama = false;
    const PREFERRED_MODELS = ['llama3.2', 'llama3', 'mistral', 'hermes'];
    let selectedModel = model || 'llama3.2:latest';

    try {
      const tagsRes = await fetch(`${ollamaEndpoint}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        const availableModels = (data.models || []).map((m: any) => m.name);

        if (model && availableModels.some((m: string) => m.includes(model))) {
          useOllama = true;
          selectedModel = availableModels.find((m: string) => m.includes(model)) || model;
        } else if (!model && availableModels.length > 0) {
          useOllama = true;
          const preferred = PREFERRED_MODELS
            .map(p => availableModels.find((m: string) => m.includes(p)))
            .find(Boolean);
          selectedModel = preferred || availableModels[0];
        }
      }
    } catch {
      // Ollama not running
    }

    let reply = "";

    if (useOllama) {
      try {
        const r = await fetch(`${ollamaEndpoint}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: message }
            ],
            stream: false
          })
        });

        if (r.ok) {
          const data = await r.json();
          reply = data.message?.content || "";
        } else {
          const errText = await r.text();
          throw new Error(`Ollama error: ${errText}`);
        }
      } catch (err: any) {
        console.error("Ollama fetch failed:", err);
        useOllama = false;
      }
    }

    if (!useOllama) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          reply: `[Neuromatix Bridge] OpenRouter API key is missing. Configure OPENROUTER_API_KEY in the environment, or ensure Ollama is running at localhost:11434.`
        }, {
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          }
        });
      }

      const openRouterModel = model && !model.includes(":") ? model : "meta-llama/llama-3-8b-instruct:free";
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "Crimson Node",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: message }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter error: ${errText}`);
      }

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response from OpenRouter.";
    }

    return NextResponse.json({ reply }, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      }
    });

  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: error?.message || "An error occurred during chat reasoning." },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        }
      }
    );
  }
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
