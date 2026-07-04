import { useState } from 'react';

export interface Personality {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  commands: string[];
}

export function usePersonalities() {
  const [personalities] = useState<Personality[]>([
    {
      id: 'sage',
      name: 'Sage-7',
      role: 'System Architect',
      description: 'Expert in algorithmic efficiency, structured modular design, and flawless code patterns.',
      avatar: '🧠',
      commands: ['analyze structure', 'refactor module', 'generate boilerplate', 'optimize runtime'],
    },
    {
      id: 'cyber',
      name: 'ADHD',
      role: 'Security Specialist',
      description: 'Expert in secure programming practices, exception-handling design, and secure sandbox verification.',
      avatar: '🛡️',
      commands: ['audit vulnerabilities', 'sandbox verify', 'generate exception test', 'harden inputs'],
    },
  ]);

  const [activePersonalityId, setActivePersonalityId] = useState<string>('sage');

  const activePersonality = personalities.find((p) => p.id === activePersonalityId) || personalities[0];

  return {
    personalities,
    activePersonality,
    activePersonalityId,
    setActivePersonalityId,
  };
}
