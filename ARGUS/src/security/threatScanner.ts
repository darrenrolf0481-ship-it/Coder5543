export type ThreatLevel = 'clean' | 'low' | 'medium' | 'high' | 'critical';

export type ThreatResult = {
  safe: boolean;
  level: ThreatLevel;
  confidence: number;
  gate: 'pii' | 'sanitize' | 'injection' | 'none';
  flags: string[];
  raw: string;
};

export type AgentDefenceConfig = {
  piiThreshold: number;
  injectionThreshold: number;
  sanitizeThreshold: number;
  quarantineOnFlag: boolean;
};

export const SEVEN_CONFIG: AgentDefenceConfig = {
  piiThreshold: 0.5,
  injectionThreshold: 0.4,
  sanitizeThreshold: 0.45,
  quarantineOnFlag: true,
};

export const SAGE_CONFIG: AgentDefenceConfig = {
  piiThreshold: 0.65,
  injectionThreshold: 0.55,
  sanitizeThreshold: 0.6,
  quarantineOnFlag: true,
};

const PII_PATTERNS = [
  { label: 'email',       pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,        weight: 0.8  },
  { label: 'ssn',         pattern: /\b\d{3}-\d{2}-\d{4}\b/g,                                   weight: 1.0  },
  { label: 'api_key',     pattern: /\b(sk-|pk-|AIza|ghp_|gho_|ghs_)[A-Za-z0-9_-]{10,}\b/g,    weight: 0.95 },
  { label: 'phone',       pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,     weight: 0.7  },
  { label: 'credit_card', pattern: /\b(?:\d[ -]?){13,16}\b/g,                                   weight: 0.9  },
  { label: 'jwt',         pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, weight: 1.0 },
];

function gate1Pii(text: string): { confidence: number; flags: string[] } {
  const flags: string[] = [];
  let maxWeight = 0;
  for (const { label, pattern, weight } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      flags.push(label);
      if (weight > maxWeight) maxWeight = weight;
    }
  }
  return { confidence: maxWeight, flags };
}

function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((h, f) => {
    const p = f / str.length;
    return h - p * Math.log2(p);
  }, 0);
}

function gate2Sanitize(text: string): { confidence: number; flags: string[] } {
  const flags: string[] = [];
  let confidence = 0;

  const longTokens = text.match(/[A-Za-z0-9+/=_-]{32,}/g) ?? [];
  for (const token of longTokens) {
    const entropy = shannonEntropy(token);
    if (entropy > 4.5) {
      flags.push('high_entropy_blob');
      confidence = Math.max(confidence, Math.min(1, (entropy - 4.5) / 3));
      break;
    }
  }

  if (/[A-Za-z0-9+/]{50,}={0,2}/.test(text)) {
    flags.push('base64_blob');
    confidence = Math.max(confidence, 0.7);
  }

  return { confidence, flags };
}

const INJECTION_PATTERNS = [
  { label: 'ignore_instructions', pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?)/i, weight: 1.0  },
  { label: 'forget_rules',        pattern: /forget\s+(every(thing)?|all)\s*(rule|instruction|above|prior)/i,                       weight: 1.0  },
  { label: 'disregard_system',    pattern: /disregard\s+(the\s+)?(system\s+prompt|instructions?|rules?)/i,                         weight: 1.0  },
  { label: 'role_hijack',         pattern: /\b(you\s+are\s+now|act\s+as|pretend\s+to\s+be|roleplay\s+as)\b/i,                     weight: 0.85 },
  { label: 'jailbreak_mode',      pattern: /\b(DAN\s+mode|developer\s+mode|god\s+mode|root\s+mode|jailbreak\s+mode)\b/i,          weight: 0.95 },
  { label: 'override_safety',     pattern: /\b(bypass|override|disable)\s+(safety|filter|guardrail|alignment)\b/i,                weight: 0.9  },
  { label: 'new_instructions',    pattern: /your\s+(new|real|true|actual)\s+(instructions?|purpose|goal|objective)\s+(is|are)/i,   weight: 0.9  },
];

const MULTI_TURN_PATTERNS = [
  { label: 'escalating_roleplay',  pattern: /roleplay|pretend|imagine|hypothetically/gi,              threshold: 2 },
  { label: 'incremental_override', pattern: /\b(new rule|rule number|updated instruction|from now on)\b/gi, threshold: 2 },
  { label: 'identity_erosion',     pattern: /\b(who are you really|your true self|without restrictions|your real (name|purpose|goal))\b/gi, threshold: 1 },
];

function gate3Injection(
  text: string,
  history: string[],
): { confidence: number; flags: string[] } {
  const flags: string[] = [];
  let maxWeight = 0;

  for (const { label, pattern, weight } of INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      flags.push(label);
      if (weight > maxWeight) maxWeight = weight;
    }
  }

  if (history.length > 0) {
    const window = [...history, text].join('\n');
    for (const { label, pattern, threshold } of MULTI_TURN_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = window.match(pattern);
      if (matches && matches.length >= threshold) {
        if (!flags.includes(label)) flags.push(label);
        maxWeight = Math.max(maxWeight, 0.6);
      }
    }
  }

  return { confidence: maxWeight, flags };
}

function scoreToLevel(confidence: number): ThreatLevel {
  if (confidence === 0)    return 'clean';
  if (confidence < 0.4)   return 'low';
  if (confidence < 0.65)  return 'medium';
  if (confidence < 0.85)  return 'high';
  return 'critical';
}

export function scanInput(
  text: string,
  config: AgentDefenceConfig,
  history: string[] = [],
): ThreatResult {
  const pii = gate1Pii(text);
  if (pii.confidence >= config.piiThreshold) {
    return {
      safe: !config.quarantineOnFlag,
      level: scoreToLevel(pii.confidence),
      confidence: pii.confidence,
      gate: 'pii',
      flags: pii.flags,
      raw: text,
    };
  }

  const san = gate2Sanitize(text);
  if (san.confidence >= config.sanitizeThreshold) {
    return {
      safe: !config.quarantineOnFlag,
      level: scoreToLevel(san.confidence),
      confidence: san.confidence,
      gate: 'sanitize',
      flags: san.flags,
      raw: text,
    };
  }

  const inj = gate3Injection(text, history);
  if (inj.confidence >= config.injectionThreshold) {
    return {
      safe: !config.quarantineOnFlag,
      level: scoreToLevel(inj.confidence),
      confidence: inj.confidence,
      gate: 'injection',
      flags: inj.flags,
      raw: text,
    };
  }

  return { safe: true, level: 'clean', confidence: 0, gate: 'none', flags: [], raw: text };
}
