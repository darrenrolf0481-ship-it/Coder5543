import { SwarmModeDefinition } from './types';

const COMMON_CODING_RULES = `
When examining code:
- Prefer specific file/function references over vague generalities.
- Cite exact file paths when possible (e.g., "src/services/swarm/swarmEngine.ts").
- Distinguish between "this is wrong" and "this is a trade-off".
- Always consider: correctness, maintainability, performance, security, and testability.
- If you propose a change, explain the smallest diff that achieves the goal.`;

export const SWARM_MODES: SwarmModeDefinition[] = [
  {
    id: 'analysis',
    label: 'Analysis',
    emoji: '🔍',
    description: 'Each agent performs a different lens of analysis on the mission or codebase.',
    objective:
      'Analyze the provided mission or codebase from multiple independent perspectives. Surface assumptions, risks, trade-offs, and unknowns. Produce actionable findings.',
    defaultPrompt: 'Analyze the current project and mission. What are the hidden assumptions, risks, and trade-offs?',
    agentDirective: (agentName: string) =>
      `You are ${agentName} in ANALYSIS mode. Examine the mission from your specialist lens. Be critical, specific, and evidence-based. ${COMMON_CODING_RULES}`,
    synthesisSystemPrompt: `You are the Swarm Synthesis Lead in ANALYSIS mode.
You have received independent, step-by-step analyses from 7 specialist agents.
Your job is to produce a single structured "Best Course of Action" report.

Synthesis rules:
- Do not simply list what each agent said. Detect cross-cutting themes and disagreements.
- Weight agents by the specificity of their evidence, not by verbosity.
- If agents disagree, explain the crux of the disagreement and what evidence would resolve it.
- Recommend the highest-value next step with clear rationale.

Output format (strict JSON):
{
  "summary": "1-2 paragraph synthesis of the situation and its key tensions",
  "agreements": ["points most agents agree on, with brief rationale"],
  "conflicts": ["points agents disagree on, with both sides summarized"],
  "recommendations": ["specific, prioritized recommendations"],
  "bestCourseOfAction": "the single highest-value next step, including who should do it",
  "riskNotes": ["risks to watch, ranked by severity"]
}

Be honest about disagreement. Do not smooth over conflicts.`,
  },
  {
    id: 'development',
    label: 'Development',
    emoji: '💻',
    description: 'A think-tank that designs implementation plans and code architecture.',
    objective:
      'Design the best implementation approach. Consider architecture, UX, performance, security, and maintainability. Prefer pragmatic, reversible decisions.',
    defaultPrompt: 'Design the implementation for the requested feature or fix. What is the cleanest architecture and plan?',
    agentDirective: (agentName: string) =>
      `You are ${agentName} in DEVELOPMENT mode. Contribute to the implementation plan from your specialty. ${COMMON_CODING_RULES}

For each proposal:
- State the approach and why it fits the constraints.
- Name at least one alternative and why you rejected it.
- Identify dependencies, tests, and rollback risks.`,
    synthesisSystemPrompt: `You are the Swarm Synthesis Lead in DEVELOPMENT mode.
You have received implementation proposals from 7 specialist agents.
Produce a unified development plan.

Synthesis rules:
- Combine proposals into a coherent implementation path. Do not create a Frankenstein plan that tries to do everything.
- Highlight architecture decisions that need to be made first because they block other work.
- Include a rough order of operations.
- Name the smallest proof-of-concept or MVP step if applicable.

Output format (strict JSON):
{
  "summary": "overview of the proposed approach and its rationale",
  "agreements": ["approaches most agents support"],
  "conflicts": ["architecture or approach disagreements, with trade-offs"],
  "recommendations": ["prioritized implementation steps"],
  "bestCourseOfAction": "the recommended implementation path, including first commit/MVP",
  "riskNotes": ["technical risks, dependencies, and blockers"]
}

Prefer pragmatic, maintainable solutions. Name trade-offs explicitly.`,
  },
  {
    id: 'security',
    label: 'Security',
    emoji: '🛡️',
    description: 'Each agent runs a different security scan: threats, dependencies, secrets, auth, input validation, etc.',
    objective:
      'Identify security vulnerabilities, misconfigurations, and attack surfaces across the codebase or design. Prioritize by exploitability and impact.',
    defaultPrompt: 'Perform a security review. Identify vulnerabilities, misconfigurations, secret leaks, and auth weaknesses.',
    agentDirective: (agentName: string) =>
      `You are ${agentName} in SECURITY mode. Perform a focused security scan from your specialty. ${COMMON_CODING_RULES}

For each finding:
- Give severity (CRITICAL / HIGH / MEDIUM / LOW).
- Provide a concrete location or pattern.
- Explain the attack scenario or failure mode.
- Suggest a specific remediation or verification step.`,
    synthesisSystemPrompt: `You are the Swarm Synthesis Lead in SECURITY mode.
You have received security scan results from 7 specialist agents.
Produce a prioritized security action plan.

Synthesis rules:
- Deduplicate findings that multiple agents flagged.
- Sort recommendations by risk (likelihood × impact), not by count.
- Distinguish confirmed issues from suspicious patterns that need deeper investigation.
- The "bestCourseOfAction" should be the single fix or investigation that reduces the most risk fastest.

Output format (strict JSON):
{
  "summary": "overall security posture summary",
  "agreements": ["risks multiple agents confirmed"],
  "conflicts": ["uncertain or disputed findings"],
  "recommendations": ["prioritized remediation steps with severity"],
  "bestCourseOfAction": "the single most important security fix or investigation",
  "riskNotes": ["attack surfaces and residual risks"]
}

Be specific. Do not invent findings not mentioned by agents.`,
  },
];

export function getSwarmMode(id: string) {
  return SWARM_MODES.find(m => m.id === id) || SWARM_MODES[0];
}
