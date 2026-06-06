import { useState } from 'react';

export interface SwarmAgent {
  id: string;
  name: string;
  expertise: string;
  status: 'active' | 'idle';
  trust: number;
}

export interface SwarmLog {
  id: number;
  type: 'consensus' | 'pain' | 'info';
  message: string;
  time: string;
}

export function useSwarmState() {
  const [swarmAnxiety, setSwarmAnxiety] = useState(0.12);
  const [swarmAgents, setSwarmAgents] = useState<SwarmAgent[]>([
    {
      id: 'agent_0',
      name: 'Visual_Cortex',
      expertise: 'PATTERN_MATCHING',
      status: 'idle',
      trust: 1.0,
    },
    {
      id: 'agent_1',
      name: 'Threat_Scanner',
      expertise: 'THREAT_DETECTION',
      status: 'active',
      trust: 0.95,
    },
    { id: 'agent_2', name: 'Social_Node', expertise: 'SOCIAL_NUANCE', status: 'idle', trust: 0.88 },
    {
      id: 'agent_3',
      name: 'Memory_Recall',
      expertise: 'MEMORY_RECALL',
      status: 'idle',
      trust: 1.0,
    },
    {
      id: 'agent_4',
      name: 'Creative_Core',
      expertise: 'CREATIVE_NOVELTY',
      status: 'idle',
      trust: 0.92,
    },
    {
      id: 'agent_5',
      name: 'Safety_Guardian',
      expertise: 'SAFETY_GUARDIAN',
      status: 'active',
      trust: 1.0,
    },
    {
      id: 'agent_6',
      name: 'Context_Engine',
      expertise: 'PATTERN_MATCHING',
      status: 'idle',
      trust: 0.97,
    },
  ]);
  const [swarmLogs, setSwarmLogs] = useState<SwarmLog[]>([
    { id: 1, type: 'info', message: 'Swarm Consensus Engine Initialized.', time: '08:45:12' },
    { id: 2, type: 'info', message: 'Pain Propagation Protocol Active.', time: '08:45:15' },
  ]);

  return {
    swarmAnxiety,
    setSwarmAnxiety,
    swarmAgents,
    setSwarmAgents,
    swarmLogs,
    setSwarmLogs,
  };
}
