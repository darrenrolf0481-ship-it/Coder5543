import { useCallback, useState } from 'react';
import { Personality } from '../data/personalities';
import { runSwarmCycle, AIResponseFn } from '../services/swarm/swarmEngine';
import { AgentRunResult, SwarmEngineContext } from '../services/swarm/types';
import { UseSwarmStateReturn } from './useSwarmState';

export interface UseSwarmProps {
  state: UseSwarmStateReturn;
  generateAIResponse: AIResponseFn;
  activePersonality: Personality;
  projectFiles: { id: string; name: string; content?: string; language?: string }[];
  activeFileId?: string;
  editorContent?: string;
  editorLanguage?: string;
  onAgentChatUpdate?: (agentName: string, text: string, phase: 'start' | 'claim' | 'complete') => void;
}

export function useSwarm({
  state,
  generateAIResponse,
  activePersonality,
  projectFiles,
  activeFileId,
  editorContent,
  editorLanguage,
  onAgentChatUpdate,
}: UseSwarmProps) {
  const {
    swarmMode,
    enableCritique,
    enabledBoosts,
    swarmAgents,
    setRuntimeAgents,
    swarmRepos,
    swarmLogs,
    setSwarmLogs,
    setSwarmAnxiety,
    setLastReport,
  } = state;

  const [missionInput, setMissionInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const addLog = useCallback(
    (type: 'consensus' | 'pain' | 'info', message: string) => {
      setSwarmLogs(prev => [
        { id: Date.now(), type, message, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    },
    [setSwarmLogs]
  );

  const updateAgentStatus = useCallback(
    (agentId: string, status: any, meta?: string) => {
      setRuntimeAgents(prev =>
        prev.map(a => {
          if (a.id !== agentId) return a;
          return { ...a, status, error: status === 'error' ? meta || a.error : undefined };
        })
      );
      if (status === 'thinking') {
        const agent = swarmAgents.find(a => a.id === agentId);
        if (agent) onAgentChatUpdate?.(agent.name, `🧠 ${agent.name} is analyzing...`, 'start');
      }
    },
    [setRuntimeAgents, swarmAgents, onAgentChatUpdate]
  );

  const handleAgentComplete = useCallback(
    (result: AgentRunResult) => {
      const agent = swarmAgents.find(a => a.id === result.agentId);
      if (!agent) return;
      if (result.status === 'fulfilled' && result.response) {
        const claims = result.keyClaims?.length ? result.keyClaims.join('\n- ') : 'No key claims extracted.';
        onAgentChatUpdate?.(
          agent.name,
          `**${agent.name}** (${agent.expertise}) — Confidence: ${result.confidence !== undefined ? `${(result.confidence * 100).toFixed(0)}%` : 'unknown'}\n\nKey claims:\n- ${claims}`,
          'claim'
        );
      } else if (result.status === 'rejected') {
        onAgentChatUpdate?.(agent.name, `**${agent.name}** failed: ${result.error}`, 'claim');
      }
    },
    [swarmAgents, onAgentChatUpdate]
  );

  const triggerSwarmCycle = useCallback(
    async (missionOverride?: string) => {
      const mission = (missionOverride || missionInput).trim();
      if (!mission) {
        addLog('pain', 'No mission provided. Enter a prompt before triggering the swarm.');
        return;
      }

      const activeAgents = swarmAgents.filter(a => a.active);
      if (activeAgents.length === 0) {
        addLog('pain', 'No active agents. Activate at least one agent.');
        return;
      }

      setIsRunning(true);
      setRuntimeAgents(activeAgents.map(a => ({ ...a, status: 'idle' })));
      addLog('info', `Starting ${swarmMode} swarm with ${activeAgents.length} agents...`);

      try {
        const ctx: SwarmEngineContext = {
          mode: swarmMode,
          mission,
          agents: activeAgents,
          activePersonality,
          repos: swarmRepos,
          enableCritique,
          enabledBoosts,
          projectFiles: projectFiles || [],
          activeFileId,
          editorContent,
          editorLanguage,
        };

        const report = await runSwarmCycle(ctx, generateAIResponse, updateAgentStatus, handleAgentComplete);
        setLastReport(report);

        // Simple anxiety derived from conflict ratio
        const conflictRatio =
          report.conflicts.length / Math.max(1, report.agreements.length + report.conflicts.length);
        setSwarmAnxiety(Number(conflictRatio.toFixed(2)));

        addLog(
          'consensus',
          `Swarm synthesis complete. ${report.recommendations.length} recommendations, ${report.conflicts.length} conflicts.`
        );
        onAgentChatUpdate?.(
          'Swarm Synthesis',
          `## Swarm Report — ${swarmMode}\n\n**Best Course of Action:** ${report.bestCourseOfAction}\n\n**Summary:** ${report.summary}`,
          'complete'
        );
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog('pain', `Swarm cycle failed: ${msg}`);
      } finally {
        setIsRunning(false);
      }
    },
    [
      missionInput,
      swarmAgents,
      swarmMode,
      enableCritique,
      enabledBoosts,
      swarmRepos,
      activePersonality,
      projectFiles,
      activeFileId,
      editorContent,
      editorLanguage,
      generateAIResponse,
      updateAgentStatus,
      addLog,
      setLastReport,
      setSwarmAnxiety,
      setRuntimeAgents,
    ]
  );

  return {
    missionInput,
    setMissionInput,
    isRunning,
    triggerSwarmCycle,
    swarmLogs,
    addLog,
  };
}

export type { AgentRunResult, SwarmAgent, SwarmMode, SwarmReport, AssignedRepo } from '../services/swarm/types';
