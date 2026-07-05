import { useArgusStore } from '../store/useArgusStore';
import { useAgentBridge } from './useAgentBridge';

// Mounts both agent bridges once at the app root. Endpoints stay null until
// the user runs `seven connect` / `sage connect` in chat, so nothing dials
// out on its own.
export function useAgentBridges() {
  const sevenEndpoint = useArgusStore((s) => s.sevenEndpoint);
  const sageEndpoint = useArgusStore((s) => s.sageEndpoint);
  useAgentBridge('seven', sevenEndpoint);
  useAgentBridge('sage', sageEndpoint);
}
