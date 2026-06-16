/**
 * Inner App Communication Bus
 *
 * Unified event system for cross-panel communication.
 * Allows any component to broadcast and subscribe to app-wide events.
 */

type EventType =
  // Swarm Events
  | 'swarm:started'
  | 'swarm:completed'
  | 'swarm:error'
  | 'swarm:agent_update'
  | 'swarm:log'

  // Analysis Events
  | 'analysis:started'
  | 'analysis:completed'
  | 'analysis:error'
  | 'analysis:result'

  // Editor Events
  | 'editor:file_changed'
  | 'editor:file_saved'
  | 'editor:code_executed'

  // Terminal Events
  | 'terminal:output'
  | 'terminal:command'

  // Brain Events
  | 'brain:activated'
  | 'brain:memory_stored'
  | 'brain:insight'

  // Project Events
  | 'project:loaded'
  | 'project:switched'
  | 'project:saved'

  // Git Events
  | 'git:committed'
  | 'git:pulled'
  | 'git:pushed'

  // AI Events
  | 'ai:request_started'
  | 'ai:request_completed'
  | 'ai:response';

export interface AppEvent {
  type: EventType;
  payload: any;
  timestamp: number;
  source?: string; // Component that emitted the event
}

type EventCallback = (event: AppEvent) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();
  private history: AppEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event
   */
  emit(eventType: EventType, payload: any, source?: string): void {
    const event: AppEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source,
    };

    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify all listeners
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, err);
        }
      });
    }
  }

  /**
   * Get event history
   */
  getHistory(): AppEvent[] {
    return [...this.history];
  }

  /**
   * Get recent events of a specific type
   */
  getRecent(eventType: EventType, count = 10): AppEvent[] {
    return this.history
      .filter(e => e.type === eventType)
      .slice(-count);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Create a scoped emitter for a specific component
   */
  createEmitter(source: string) {
    return {
      emit: (eventType: EventType, payload: any) => {
        this.emit(eventType, payload, source);
      },
    };
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Helper hooks for React components
import { useEffect } from 'react';

export function useEventListener(
  eventType: EventType,
  callback: EventCallback,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventType, callback);
    return unsubscribe;
  }, [eventType, ...deps]);
}

export function useEventEmitter(source: string) {
  return eventBus.createEmitter(source);
}

/**
 * Example usage:
 *
 * // In a component:
 * const emitter = useEventEmitter('SwarmPanel');
 *
 * emitter.emit('swarm:completed', { results: [...] });
 *
 * // In another component:
 * useEventListener('swarm:completed', (event) => {
 *   console.log('Swarm finished:', event.payload);
 *   // Automatically update UI
 * });
 */