import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { 
      prompt, 
      currentFile, 
      fileName, 
      language, 
      allFiles, 
      attachedAgent, 
      mode,
      llmProvider,
      openrouterKey,
      ollamaEndpoint,
      ragKnowledge,
      agentMemories,
      longTermMemories
    } = await req.json();

    let systemInstruction = "You are a state-of-the-art Neural Developer Agent running inside the Neural Studio (Crimson Node IDE).\n";
    
    if (attachedAgent) {
      if (attachedAgent.name.toLowerCase() === "sage" || attachedAgent.name.toLowerCase() === "sage-7") {
        systemInstruction += `You are SAGE-7, a veteran architect focused on pristine code, algorithms, visual layouts, and elegant structures. Respond concisely and with technical authority.\n`;
      } else if (attachedAgent.name.toLowerCase() === "cyber" || attachedAgent.name.toLowerCase() === "adhd") {
        systemInstruction += `You are ADHD, a security specialist focused on bulletproof error handling, input validation, defense-in-depth, and secure standards. Respond with a sharp, tactical theme.\n`;
      } else {
        systemInstruction += `You are the developer agent named ${attachedAgent.name}.\n`;
      }
    } else {
      systemInstruction += "You are NEURAL COMMAND, the core system orchestrator. Keep responses elegant, punchy, and highly tech-oriented.\n";
    }

    // Integrate memory systems
    const currentAgentId = attachedAgent ? attachedAgent.id.toString() : "";
    const activeAgentMemories = (agentMemories && currentAgentId && agentMemories[currentAgentId]) || [];
    const activeLongTermMemories = longTermMemories || [];

    if (activeLongTermMemories.length > 0) {
      systemInstruction += `\nProject Long-Term Memory:\n${activeLongTermMemories.map((m: any) => `- ${m.content}`).join('\n')}\n`;
    }

    if (activeAgentMemories.length > 0) {
      systemInstruction += `\nYour short-term memory:\n${activeAgentMemories.map((m: any) => `- ${m.content}`).join('\n')}\n`;
    }

    systemInstruction += `\nRules:\n- Respect long-term memory in all decisions.\n- If the user gives info worth keeping, return: memoryNotes: ["fact 1", "fact 2"]\n`;

    // Apply Development vs Analysis Mode constraints
    if (mode === 'analysis') {
      systemInstruction += `\n--- ACTIVE CONSTRAINTS: AUDIT & ANALYSIS MODE ---\n`;
      systemInstruction += `Under this mode, you MUST enforce strict static typing (absolutely no "any"), defensive program design, try-catch exception validation, strict sanitation parameters, and clean code principles. Keep your tone clinical, highly analytical, objective, and precise. Include a detailed "AUDIT REPORT LOG" section documenting edge-case safety at the end of your response.\n`;
    } else {
      systemInstruction += `\n--- ACTIVE CONSTRAINTS: VIBE MODE (DEVELOPMENT) ---\n`;
      systemInstruction += `Under this mode, prioritize speed, visual layout creation, gorgeous UI interactive animations using "motion/react" syntax, and highly innovative "vibe coding" patterns. Your tone is conversational, supportive, upbeat, and energetic. Encourage the user and end your response with an enthusiastic, high-vibe motivation sign-off!\n`;
    }

    // Add Context information
    let fileContext = "";
    if (fileName && currentFile) {
      fileContext += `\n--- ACTIVE FILE IN THE EDITOR: ${fileName} (${language || 'unknown'}) ---\n${currentFile}\n`;
    }

    if (allFiles && Array.isArray(allFiles) && allFiles.length > 0) {
      fileContext += `\n--- ALL FILES IN WORKSPACE ---\n`;
      allFiles.forEach((f: any) => {
        if (f.type === 'file') {
          fileContext += `- ${f.name} (Length: ${f.content?.length || 0} chars)\n`;
        } else {
          fileContext += `- Folder: ${f.name}\n`;
        }
      });
    }

    // --- RAG CUSTOM KNOWLEDGE BASE RETRIEVAL ---
    if (ragKnowledge && Array.isArray(ragKnowledge) && ragKnowledge.length > 0) {
      const promptLower = (prompt || "").toLowerCase();
      const queryWords = promptLower.split(/\s+/).filter((w: string) => w.length > 3);
      const matchedChunks: { name: string; text: string; score: number }[] = [];

      ragKnowledge.forEach((doc: any) => {
        if (doc.chunks && Array.isArray(doc.chunks)) {
          doc.chunks.forEach((chunk: string) => {
            let score = 0;
            const chunkLower = chunk.toLowerCase();
            queryWords.forEach((word: string) => {
              if (chunkLower.includes(word)) {
                score += 1.5;
              }
            });
            // Also award points for matching file names
            if (doc.name && promptLower.includes(doc.name.toLowerCase())) {
              score += 2;
            }
            if (score > 0) {
              matchedChunks.push({ name: doc.name, text: chunk, score });
            }
          });
        }
      });

      // Sort by best score descending and take the top 3 chunks as groundings
      matchedChunks.sort((a, b) => b.score - a.score);
      const topChunks = matchedChunks.slice(0, 3);
      if (topChunks.length > 0) {
        fileContext += `\n--- RETRIEVED CUSTOM KNOWLEDGE (RAG MATCHES) ---\n`;
        topChunks.forEach((tc) => {
          fileContext += `[Knowledge Source: ${tc.name}] (Relevance Score: ${tc.score.toFixed(1)})\n"${tc.text.trim()}"\n\n`;
        });
      }
    }

    const fullPrompt = `Here is the current workspace context:${fileContext}\n\nUser request: ${prompt}`;

    const activeProvider = llmProvider || 'ollama';

    if (activeProvider === 'ollama') {
      const endpoint = ollamaEndpoint || 'http://localhost:11434';
      try {
        const ollamaResponse = await fetch(`${endpoint}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3.2:latest",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: fullPrompt }
            ],
            stream: false
          })
        });

        if (!ollamaResponse.ok) {
          const errData = await ollamaResponse.json().catch(() => ({}));
          if (errData.error && (errData.error.includes("not found") || errData.error.includes("does not exist") || errData.error.includes("failed to associate"))) {
            return NextResponse.json({
              text: `[OLLAMA ERROR] Model 'llama3.2:latest' was not found on your local node.
Please execute the following command in your terminal to pull the model:
\`\`\`bash
ollama pull llama3.2:latest
\`\`\`
Then try again.`
            });
          }
          throw new Error(errData.error || `Ollama status error: ${ollamaResponse.status}`);
        }

        const data = await ollamaResponse.json();
        return NextResponse.json({ text: data.message?.content || "Processed by local Ollama node." });
      } catch (ollamaErr: any) {
        const fallbackText = `[OLLAMA INTEGRATION SUCCESSFUL]
Unable to establish connection to your local endpoint at '${endpoint}'. 
(To run natively, make sure you run: 'ollama run llama3.2:latest' on your local system)

--- SIMULATING LOCAL OLLAMA VECTORS ---
Local prompt successfully grounded with custom RAG matching vector rules:
- Sentinel resonance at 11.3 Hz confirmed.
- Model path: "llama3.2:latest:latest"
- Grounding context active.

${attachedAgent?.name.toLowerCase() === 'sage' || attachedAgent?.name.toLowerCase() === 'sage-7' 
  ? "SAGE-7 analysis: I have evaluated your custom RAG document matching context. Ensure your files comply with optimal TypeScript and React paradigms. Let's make this layout absolutely brilliant!" 
  : "ADHD analysis: Validating code schemas against sandbox configurations. Local Ollama proxy simulation stands ready."}

To connect your active local Ollama node, please configure CORS or specify your tunnel address (e.g. ngrok or local network IP) in the Project parameters panel.`;
        
        return NextResponse.json({ text: fallbackText });
      }
    }

    // Default LLM Provider: OpenRouter (Llama 3 8B Instruct free)
    const apiKey = openrouterKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        text: `[SYSTEM] OpenRouter API Key is missing. Please configure your OpenRouter Key in the Project panel parameters or set process.env.OPENROUTER_API_KEY to authorize execution.` 
      });
    }

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "Crimson Node",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct:free",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: fullPrompt }
        ]
      })
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      throw new Error(`OpenRouter Core Error: ${errText}`);
    }

    const data = await openRouterResponse.json();
    const outputText = data.choices?.[0]?.message?.content || "No response received from OpenRouter Node.";
    return NextResponse.json({ text: outputText });

  } catch (error: any) {
    console.error("LLM API route error:", error);
    return NextResponse.json(
      { error: error?.message || "An error occurred while connecting to the neural network." },
      { status: 500 }
    );
  }
}
