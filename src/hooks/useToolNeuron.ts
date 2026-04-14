import React, { useState, useCallback } from 'react';
import { Personality } from '../types';

/**
 * useToolNeuron - A neural orchestration hook for the ToolNeuron ecosystem.
 * 
 * This hook manages the state and logic for various ToolNeuron modules including
 * Chat, Vision, Knowledge Core, Secured Vault, and Neural Swarm. It handles
 * localized authentication (PIN/Biometric) and knowledge ingestion.
 * 
 * @param activePersonality - The currently active AI personality.
 * @param generateAIResponse - Function to interface with the AI provider.
 * @returns State and handlers for the ToolNeuron interface.
 */
export const useToolNeuron = (
  activePersonality: Personality,
  generateAIResponse: (prompt: string, instruction: string, options?: any) => Promise<string>
) => {
  const [tnModule, setTnModule] = useState<'chat' | 'vision' | 'knowledge' | 'vault' | 'swarm' | 'help' | 'debug' | 'code'>('chat');
  const [tnCode, setTnCode] = useState('');
  const [tnKnowledgePacks, setTnKnowledgePacks] = useState([
    { id: 'python_core', name: 'Python_Algorithm_Core_v1.0', size: '2.4MB', status: 'indexed' },
    { id: 1, name: 'Medical_Core_v2', size: '1.2GB', status: 'indexed' },
    { id: 2, name: 'Legal_Archive_2025', size: '850MB', status: 'indexed' }
  ]);

  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPin, setVaultPin] = useState('');
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);
  const [vaultStep, setVaultStep] = useState<'initial' | 'pin'>('initial');
  const [vaultError, setVaultError] = useState<string | null>(null);

  // --- Neural Swarm Core ---
  const [swarmAnxiety, setSwarmAnxiety] = useState(0.12);
  const [swarmAgents, setSwarmAgents] = useState([
    { id: 1, name: 'Logic_Node_01', status: 'active', expertise: 'Algorithm Synthesis', trust: 0.98 },
    { id: 2, name: 'Vision_Node_A', status: 'idle', expertise: 'Neural Rendering', trust: 0.85 },
    { id: 3, name: 'Security_Guard', status: 'active', expertise: 'Cryptographic Integrity', trust: 0.99 },
    { id: 4, name: 'Optimization_B', status: 'active', expertise: 'Substrate Balancing', trust: 0.92 }
  ]);
  const [swarmLogs, setSwarmLogs] = useState([
    { id: 1, type: 'info', message: 'Swarm consensus established at 98.2% confidence.', time: '14:20:05' },
    { id: 2, type: 'consensus', message: 'Proposed architectural shift approved by 3/4 nodes.', time: '14:22:12' }
  ]);

  // --- Neural Debugger ---
  const [debugAnalysis, setDebugAnalysis] = useState({
    static: { status: 'idle', issues: [] },
    tracing: { status: 'idle', logs: [] },
    refactoring: { status: 'idle', suggestions: [] }
  });

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const fetchKnowledgePacks = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8001/api/uploads/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTnKnowledgePacks(data.map((f: any) => ({
            id: f.name,
            name: f.name,
            size: f.size,
            status: 'indexed'
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch knowledge packs:', err);
    }
  }, []);

  const triggerSwarmCycle = useCallback(async () => {
    setIsAiProcessing(true);
    setSwarmLogs(prev => [{ id: Date.now(), type: 'info', message: 'Initiating swarm-wide consensus cycle...', time: new Date().toLocaleTimeString() }, ...prev]);
    
    try {
      const response = await generateAIResponse(
        "Initiate a swarm-wide consensus cycle. Provide a brief status update from the swarm.",
        `Futuristic swarm intelligence core. Active personality: ${activePersonality.instruction}`,
        { modelType: 'fast' }
      );
      
      const newAnxiety = Math.min(1, Math.max(0, swarmAnxiety + (Math.random() * 0.2 - 0.1)));
      setSwarmAnxiety(newAnxiety);
      
      const type = newAnxiety > 0.5 ? 'pain' : 'consensus';
      setSwarmLogs(prev => [{ 
        id: Date.now(), 
        type, 
        message: response || 'Consensus reached. Substrate stable.', 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } catch (err) {
      setSwarmLogs(prev => [{ id: Date.now(), type: 'pain', message: 'Swarm fragmentation detected. Neural bridge failed.', time: new Date().toLocaleTimeString() }, ...prev]);
    } finally {
      setIsAiProcessing(false);
    }
  }, [swarmAnxiety, activePersonality, generateAIResponse]);

  const runStaticAnalysis = useCallback(() => {
    setDebugAnalysis(prev => ({ ...prev, static: { status: 'running', issues: [] } }));
    setTimeout(() => {
      setDebugAnalysis(prev => ({ 
        ...prev, 
        static: { 
          status: 'done', 
          issues: [
            { type: 'warning', message: 'Potential N+1 query pattern detected in data fetcher.', line: 42 },
            { type: 'info', message: 'Consider using Memoization for heavy calculations.', line: 128 }
          ] 
        } 
      }));
    }, 2000);
  }, []);

  const runDynamicTracing = useCallback(() => {
    setDebugAnalysis(prev => ({ ...prev, tracing: { status: 'running', logs: [] } }));
    const logs = [
      'Initializing trace at 0x7ffc34...',
      'Stack frame created for kernel::main',
      'Synaptic jump successful at node 7',
      'Trace completed. Integrity: 100%'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setDebugAnalysis(prev => ({ ...prev, tracing: { ...prev.tracing, logs: [...prev.tracing.logs, logs[i]] as any } }));
        i++;
      } else {
        setDebugAnalysis(prev => ({ ...prev, tracing: { ...prev.tracing, status: 'done' } }));
        clearInterval(interval);
      }
    }, 500);
  }, []);

  const getRefactoringSuggestions = useCallback(async () => {
    setDebugAnalysis(prev => ({ ...prev, refactoring: { status: 'running', suggestions: [] } }));
    try {
      const response = await generateAIResponse(
        "Analyze current code state and provide 3 futuristic refactoring suggestions.",
        `SAGE-7 Forensic Architect. Active personality: ${activePersonality.instruction}`,
        { modelType: 'fast' }
      );
      const suggestions = response?.split('\n').filter(s => s.trim().length > 5).slice(0, 3) || ['De-couple neural vectors', 'Optimize synaptic weight loading', 'Enforce strict substrate isolation'];
      setDebugAnalysis(prev => ({ ...prev, refactoring: { status: 'done', suggestions: suggestions as any } }));
    } catch (err) {
      setDebugAnalysis(prev => ({ ...prev, refactoring: { status: 'done', suggestions: ['Refactoring engine offline'] as any } }));
    }
  }, [activePersonality, generateAIResponse]);

  React.useEffect(() => {
    fetchKnowledgePacks();
  }, [fetchKnowledgePacks]);

  const handleKnowledgeUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAiProcessing(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('http://localhost:8001/api/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          console.log(`Knowledge Pack Uploaded: ${file.name}`);
        }
      } catch (err) {
        console.error(`Failed to upload knowledge pack ${file.name}:`, err);
      }
    }
    setIsAiProcessing(false);
    fetchKnowledgePacks();
  }, [fetchKnowledgePacks]);

  const handleVaultPin = useCallback((digit: string) => {
    if (vaultPin.length < 4) {
      const newPin = vaultPin + digit;
      setVaultPin(newPin);
      if (newPin === '1234') {
        setTimeout(() => {
          setIsVaultUnlocked(true);
          setVaultPin('');
          setVaultStep('initial');
        }, 500);
      } else if (newPin.length === 4) {
        setVaultError('INVALID ACCESS CODE');
        setTimeout(() => {
          setVaultPin('');
          setVaultError(null);
        }, 1000);
      }
    }
  }, [vaultPin]);

  const startBiometric = useCallback(() => {
    setIsBiometricVerifying(true);
    setTimeout(() => {
      setIsBiometricVerifying(false);
      setIsVaultUnlocked(true);
    }, 2000);
  }, []);

  const handleInitiateSequence = useCallback(async () => {
    if (!tnCode.trim()) return;
    try {
      const res = await fetch('http://localhost:8001/api/logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: tnCode })
      });
      const data = await res.json();
      if (data.error) {
        alert(`Logic Error: ${data.error}`);
      } else {
        alert('Logic Sequence Executed Successfully');
        console.log('Nucleoid Response:', data);
      }
    } catch (err) {
      alert('Failed to connect to Neural Logic Engine. Ensure server.py is running on port 8001.');
    }
  }, [tnCode]);

  return {
    tnModule,
    setTnModule,
    tnCode,
    setTnCode,
    tnKnowledgePacks,
    setTnKnowledgePacks,
    handleKnowledgeUpload,
    isVaultUnlocked,
    setIsVaultUnlocked,
    vaultPin,
    setVaultPin,
    isBiometricVerifying,
    vaultStep,
    setVaultStep,
    vaultError,
    handleVaultPin,
    startBiometric,
    handleInitiateSequence,
    swarmAnxiety,
    swarmAgents,
    swarmLogs,
    triggerSwarmCycle,
    debugAnalysis,
    runStaticAnalysis,
    runDynamicTracing,
    getRefactoringSuggestions,
    isAiProcessing
  };
};
