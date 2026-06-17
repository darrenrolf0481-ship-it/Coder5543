import { broker } from '../messageBroker';
import { eventBus } from '../eventBus';
import { buildRepoContextForAgent } from './repoContext';
import { getSwarmMode } from './swarmModes';
import { formatBoostResultsForAgent, runMcpBoost } from './swarmMcpBoost';
import {
  AgentRunResult,
  BoostResult,
  SwarmAgent,
  SwarmAgentStatus,
  SwarmEngineContext,
  SwarmMode,
  SwarmReport,
} from './types';

export type AIResponseFn = (
  prompt: string,
  systemInstruction: string,
  options?: { modelType?: 'fast' | 'smart'; json?: boolean; responseSchema?: any },
  domain?: string
) => Promise<string>;

const MAX_PROJECT_CONTEXT_CHARS = 8_000;

function buildProjectContext(ctx: SwarmEngineContext): string {
  const parts: string[] = [];
  if (ctx.activePersonality) {
    parts.push(`Active personality: ${ctx.activePersonality.name}`);
    parts.push(`Personality directive: ${ctx.activePersonality.instruction}`);
  }
  if (ctx.editorContent && ctx.editorLanguage) {
    const trimmed = ctx.editorContent.slice(0, MAX_PROJECT_CONTEXT_CHARS);
    parts.push(`\n[ACTIVE FILE - ${ctx.activeFileId || 'unknown'}]\n\`\`\`${ctx.editorLanguage}\n${trimmed}\n\`\`\``);
  }
  if (ctx.projectFiles && ctx.projectFiles.length > 0) {
    const fileList = ctx.projectFiles
      .filter(f => f.type === 'file')
      .map(f => `- ${f.name}${f.language ? ` (${f.language})` : ''}`)
      .join('\n');
    parts.push(`\n[PROJECT FILES]\n${fileList}`);
  }
  return parts.join('\n\n');
}

function buildAgentPrompt(agent: SwarmAgent, mode: ReturnType<typeof getSwarmMode>, ctx: SwarmEngineContext, boostCtx: string): string {
  const repoCtx = buildRepoContextForAgent(agent, ctx.repos || []);
  const projectCtx = buildProjectContext(ctx);

  return `${mode.agentDirective(agent.name)}

${agent.roleInMode[ctx.mode] || `Contribute your ${agent.expertise} perspective.`}

[MISSION]
${ctx.mission}

${projectCtx}

${boostCtx}

${repoCtx.context}

[REASONING PROTOCOL — think step by step]
1. OBSERVE: Restate the mission in your own words and list the concrete facts, constraints, and entities involved.
2. ANALYZE: Apply your specialty. Reference specific files, patterns, or code structures when relevant. Identify assumptions and edge cases.
3. EVALUATE: Weigh trade-offs, risks, and alternatives. If something is unclear, say so. Do not fabricate certainty.
4. CONCLUDE: Summarize your judgment in 3-7 key claims.

[OUTPUT FORMAT]
- Use clear headings for OBSERVE, ANALYZE, EVALUATE, CONCLUDE.
- Under CONCLUDE, include a "Key Claims" section with 3-7 bullet points.
- End with "Confidence: 0.XX" (0.00–1.00) reflecting how certain you are given the evidence.
${getModeOutputAddendum(ctx.mode)}`;
}

function getModeOutputAddendum(mode: SwarmMode): string {
  switch (mode) {
    case 'development':
      return `- If you propose code changes, include them as fenced code blocks with the target file path in a comment above the block.
- Prefer showing a unified diff or a "before / after" snippet rather than dumping entire files.
- If no code change is needed, say so explicitly.`;
    case 'security':
      return `- For each finding, include a concrete attack scenario or failure mode.
- If a finding is speculative, label it "SPECULATIVE" and state what evidence would confirm it.`;
    case 'analysis':
    default:
      return `- Distinguish facts from interpretations. Flag anything you are uncertain about.`;
  }
}

function parseConfidence(text: string): number | undefined {
  const match = text.match(/Confidence\s*[:=]\s*(0\.\d+|1\.0|1)/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val)) return Math.max(0, Math.min(1, val));
  }
  return undefined;
}

function parseKeyClaims(text: string): string[] {
  const claims: string[] = [];
  // Look for a "Key Claims" section and bullet points
  const sectionMatch = text.match(/Key Claims:?\s*([\s\S]*?)(?=Confidence:|$)/i);
  const section = sectionMatch ? sectionMatch[1] : text;
  const lines = section.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      claims.push(trimmed.replace(/^[-*•]\s+/, ''));
    }
  }
  return claims;
}

export async function runSwarmCycle(
  ctx: SwarmEngineContext,
  generate: AIResponseFn,
  onAgentStatus?: (agentId: string, status: SwarmAgentStatus, meta?: string) => void,
  onAgentComplete?: (result: AgentRunResult) => void
): Promise<SwarmReport> {
  const mode = getSwarmMode(ctx.mode);
  const activeAgents = ctx.agents.filter(a => a.active);

  if (activeAgents.length === 0) {
    throw new Error('No active agents in the swarm.');
  }

  broker.publish(
    'SWARM_CYCLE_START',
    { mode: ctx.mode, mission: ctx.mission, agentCount: activeAgents.length },
    'swarm'
  );
  eventBus.emit(
    'swarm:started',
    { mode: ctx.mode, mission: ctx.mission, agentCount: activeAgents.length },
    'swarm'
  );

  const projectCtx = buildProjectContext(ctx);

  // Phase 0 (optional): MCP boosts — run before agents and feed results into context
  let boostResults: BoostResult[] = [];
  const enabledBoosts = ctx.enabledBoosts || [];
  if (enabledBoosts.length > 0) {
    broker.publish('SWARM_CONSENSUS', { message: `Running MCP boosts: ${enabledBoosts.join(', ')}` }, 'swarm');
    for (const boostId of enabledBoosts) {
      try {
        const results = await runMcpBoost(boostId);
        boostResults.push(...results);
      } catch (err: any) {
        boostResults.push({
          boostId,
          toolName: 'boost_loader',
          status: 'error',
          output: '',
          error: err instanceof Error ? err.message : String(err),
          latencyMs: 0,
        });
      }
    }
  }
  const boostCtx = enabledBoosts
    .map(id => formatBoostResultsForAgent(boostResults.filter(r => r.boostId === id), id))
    .join('\n\n---\n\n');

  // Phase 1: run all agents in parallel
  const runPromises = activeAgents.map(async agent => {
    const start = performance.now();
    onAgentStatus?.(agent.id, 'reading_repos');
    const repoCtx = buildRepoContextForAgent(agent, ctx.repos || []);

    onAgentStatus?.(agent.id, 'thinking');
    try {
      const prompt = buildAgentPrompt(agent, mode, ctx, boostCtx);
      // Give each agent its own abort domain so they never cancel one another,
      // even if the orchestrator defaults change in the future.
      const response = await generate(
        prompt,
        agent.systemPrompt,
        { modelType: 'smart' },
        `swarm-agent-${agent.id}`
      );
      const latencyMs = Math.round(performance.now() - start);
      onAgentStatus?.(agent.id, 'done');
      const result: AgentRunResult = {
        agentId: agent.id,
        status: 'fulfilled' as const,
        response,
        keyClaims: parseKeyClaims(response),
        confidence: parseConfidence(response),
        latencyMs,
      };
      onAgentComplete?.(result);
      eventBus.emit(
        'swarm:agent_update',
        { agentId: agent.id, agentName: agent.name, status: 'done', output: response, keyClaims: result.keyClaims, confidence: result.confidence },
        'swarm'
      );
      return result;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      onAgentStatus?.(agent.id, 'error', err.message);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const result: AgentRunResult = {
        agentId: agent.id,
        status: 'rejected' as const,
        error: errorMsg,
        latencyMs,
      };
      onAgentComplete?.(result);
      eventBus.emit(
        'swarm:agent_update',
        { agentId: agent.id, agentName: agent.name, status: 'error', output: errorMsg },
        'swarm'
      );
      eventBus.emit('swarm:error', { agentId: agent.id, agentName: agent.name, error: errorMsg }, 'swarm');
      return result;
    }
  });

  let agentResults: AgentRunResult[] = await Promise.all(runPromises);

  // Phase 2 (optional): critique + refinement
  if (ctx.enableCritique && activeAgents.length >= 2) {
    broker.publish('SWARM_CONFLICT', { message: 'Starting critique and refinement round' }, 'swarm');
    agentResults = await runCritiqueAndRefinement(activeAgents, agentResults, ctx, generate, onAgentStatus);
  }

  // Phase 3: synthesize
  const synthesisPrompt = buildSynthesisPrompt(mode, ctx.mission, agentResults, projectCtx);
  const synthesisSystem = mode.synthesisSystemPrompt;

  let rawSynthesis = '';
  try {
    rawSynthesis = await generate(synthesisPrompt, synthesisSystem, { modelType: 'smart', json: true });
  } catch (err: any) {
    broker.publish('AI_REQUEST_FAILED', { stage: 'swarm-synthesis', error: err.message }, 'swarm');
    rawSynthesis = JSON.stringify({
      summary: `Synthesis failed: ${err.message}`,
      agreements: [],
      conflicts: [],
      recommendations: ['Retry the swarm cycle.'],
      bestCourseOfAction: 'Retry the swarm cycle.',
      riskNotes: ['Synthesis step encountered an error.'],
    });
  }

  const report = parseSynthesisReport(rawSynthesis);
  const finalReport: SwarmReport = {
    ...report,
    mode: ctx.mode,
    mission: ctx.mission,
    agentResults,
    boostResults: boostResults.length > 0 ? boostResults : undefined,
    synthesizedAt: Date.now(),
  };

  broker.publish(
    'SWARM_CONSENSUS',
    { report: finalReport, agreementCount: report.agreements.length, conflictCount: report.conflicts.length },
    'swarm'
  );
  eventBus.emit(
    'swarm:completed',
    { report: finalReport, mission: ctx.mission, agreementCount: report.agreements.length, conflictCount: report.conflicts.length },
    'swarm'
  );

  return finalReport;
}

async function runCritiqueAndRefinement(
  activeAgents: SwarmAgent[],
  initialResults: AgentRunResult[],
  ctx: SwarmEngineContext,
  generate: AIResponseFn,
  onAgentStatus?: (agentId: string, status: SwarmAgentStatus, meta?: string) => void
): Promise<AgentRunResult[]> {
  const resultsById = new Map(initialResults.map(r => [r.agentId, r]));

  // Each agent critiques the two agents that follow them in the roster
  const critiquePromises = activeAgents.map(async (agent, index) => {
    const targets = [
      activeAgents[(index + 1) % activeAgents.length],
      activeAgents[(index + 2) % activeAgents.length],
    ];
    const targetResults = targets
      .map(t => resultsById.get(t.id))
      .filter((r): r is AgentRunResult => !!r && r.status === 'fulfilled');
    if (targetResults.length === 0) return { agentId: agent.id, critiques: [] as string[] };

    const critiquePrompt = `You are ${agent.name}. Review the following responses from two other agents. For each, provide:
1. One strength (what they got right)
2. One gap or weakness (what they missed or misjudged)
3. One specific question that would improve their analysis

${targetResults.map(r => `--- RESPONSE FROM ${r.agentId} ---\n${r.response}`).join('\n\n')}`;

    try {
      const critiqueText = await generate(critiquePrompt, agent.systemPrompt, { modelType: 'smart' });
      return { agentId: agent.id, critiques: [critiqueText] };
    } catch {
      return { agentId: agent.id, critiques: [] as string[] };
    }
  });

  const critiques = await Promise.all(critiquePromises);
  const critiquesByAgent = new Map(critiques.map(c => [c.agentId, c.critiques]));

  // Refinement pass
  const refinementPromises: Promise<AgentRunResult>[] = activeAgents.map(async agent => {
    const initial = resultsById.get(agent.id);
    if (!initial || initial.status === 'rejected') return initial!;

    onAgentStatus?.(agent.id, 'thinking', 'refining');
    const start = performance.now();
    const feedback = critiquesByAgent.get(agent.id)?.join('\n\n') || 'No external critiques received.';

    const refinePrompt = `You are ${agent.name}. Here is your initial analysis:

${initial.response}

Here is feedback from other agents on your analysis:
${feedback}

Revise your analysis. Keep what is correct, fix anything that was weak or wrong, and deepen your reasoning. Maintain the same output format: OBSERVE, ANALYZE, EVALUATE, CONCLUDE with Key Claims and Confidence.`;

    try {
      const revised = await generate(refinePrompt, agent.systemPrompt, { modelType: 'smart' });
      const latencyMs = initial.latencyMs + Math.round(performance.now() - start);
      onAgentStatus?.(agent.id, 'done');
      return {
        agentId: agent.id,
        status: 'fulfilled' as const,
        response: revised,
        keyClaims: parseKeyClaims(revised),
        confidence: parseConfidence(revised),
        latencyMs,
      };
    } catch (err: any) {
      onAgentStatus?.(agent.id, 'error', err.message);
      return initial;
    }
  });

  return Promise.all(refinementPromises);
}

function buildSynthesisPrompt(
  mode: ReturnType<typeof getSwarmMode>,
  mission: string,
  results: AgentRunResult[],
  projectCtx: string
): string {
  const agentSections = results
    .map(r => {
      const header = `[AGENT: ${r.agentId}]`;
      if (r.status === 'rejected') {
        return `${header}\nFAILED: ${r.error}`;
      }
      return `${header}\nResponse:\n${r.response}\nKey Claims:\n${(r.keyClaims || []).map(c => `- ${c}`).join('\n')}\nConfidence: ${r.confidence ?? 'unknown'}`;
    })
    .join('\n\n---\n\n');

  return `[OBJECTIVE]\n${mode.objective}\n\n[MISSION]\n${mission}\n\n${projectCtx}\n\n[AGENT RESPONSES]\n\n${agentSections}\n\n[SYNTHESIS INSTRUCTION]\nCombine the above responses into a single structured JSON report. Be honest about conflicts. Do not fabricate findings not present in the agent responses.`;
}

function parseSynthesisReport(raw: string) {
  const cleaned = raw.replace(/```json\n?|```/g, '').trim();
  const fallback = {
    summary: 'Unable to parse synthesis report.',
    agreements: [],
    conflicts: [],
    recommendations: [],
    bestCourseOfAction: 'Review individual agent responses.',
    riskNotes: ['Synthesis output could not be parsed.'],
  };
  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: String(parsed.summary || fallback.summary),
      agreements: Array.isArray(parsed.agreements) ? parsed.agreements.map(String) : fallback.agreements,
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts.map(String) : fallback.conflicts,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : fallback.recommendations,
      bestCourseOfAction: String(parsed.bestCourseOfAction || fallback.bestCourseOfAction),
      riskNotes: Array.isArray(parsed.riskNotes) ? parsed.riskNotes.map(String) : fallback.riskNotes,
    };
  } catch {
    return fallback;
  }
}
