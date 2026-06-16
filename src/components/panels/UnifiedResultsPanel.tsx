import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Zap, Brain, Activity, Bug, GitBranch, MessageSquare } from 'lucide-react';
import { eventBus, AppEvent, useEventListener } from '../../services/eventBus';

interface ResultItem {
  id: string;
  type: 'swarm' | 'analysis' | 'ai' | 'brain' | 'debug' | 'git' | 'chat';
  title: string;
  content: string;
  timestamp: number;
  source: string;
  metadata?: any;
}

interface UnifiedResultsPanelProps {
  maxHeight?: string;
  showTabs?: boolean;
  filterTypes?: string[];
  onResultClick?: (result: ResultItem) => void;
}

export function UnifiedResultsPanel({
  maxHeight = '600px',
  showTabs = true,
  filterTypes,
  onResultClick,
}: UnifiedResultsPanelProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'swarm' | 'analysis' | 'ai' | 'brain'>('all');

  // Subscribe to swarm events
  useEventListener('swarm:completed', (event) => {
    addResult('swarm', `Swarm: ${event.payload.mission}`, event.payload, event.source);
  });

  useEventListener('swarm:agent_update', (event) => {
    addResult('swarm', `Agent: ${event.payload.agentName}`, event.payload.output, event.source);
  });

  useEventListener('swarm:error', (event) => {
    addResult('swarm', `Swarm Error`, event.payload.error, event.source);
  });

  // Subscribe to analysis events
  useEventListener('analysis:completed', (event) => {
    addResult('analysis', `Analysis: ${event.payload.type}`, event.payload.results, event.source);
  });

  useEventListener('analysis:result', (event) => {
    addResult('analysis', event.payload.title || 'Analysis Result', event.payload, event.source);
  });

  // Subscribe to AI events
  useEventListener('ai:response', (event) => {
    addResult('ai', 'AI Response', event.payload.response, event.source);
  });

  // Subscribe to brain events
  useEventListener('brain:insight', (event) => {
    addResult('brain', `Brain: ${event.payload.insight}`, event.payload, event.source);
  });

  useEventListener('brain:memory_stored', (event) => {
    addResult('brain', 'Memory Stored', event.payload, event.source);
  });

  // Subscribe to debug events
  useEventListener('editor:code_executed', (event) => {
    addResult('debug', 'Code Execution', event.payload.output, event.source);
  });

  // Subscribe to git events
  useEventListener('git:committed', (event) => {
    addResult('git', `Git: ${event.payload.message}`, event.payload, event.source);
  });

  const addResult = (
    type: ResultItem['type'],
    title: string,
    content: any,
    source?: string
  ) => {
    const result: ResultItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      timestamp: Date.now(),
      source: source || 'unknown',
    };

    setResults(prev => [result, ...prev].slice(0, 100)); // Keep last 100 results
  };

  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return results;

    const typeMap: Record<string, ResultItem['type'][]> = {
      swarm: ['swarm'],
      analysis: ['analysis', 'debug'],
      ai: ['ai'],
      brain: ['brain'],
    };

    const allowedTypes = typeMap[activeTab] || [];
    return results.filter(r => allowedTypes.includes(r.type));
  }, [results, activeTab]);

  const getTypeIcon = (type: ResultItem['type']) => {
    switch (type) {
      case 'swarm':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'analysis':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'ai':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'brain':
        return <Brain className="w-4 h-4 text-pink-400" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-green-400" />;
      case 'git':
        return <GitBranch className="w-4 h-4 text-orange-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: ResultItem['type']) => {
    switch (type) {
      case 'swarm':
        return 'border-yellow-500/30 bg-yellow-950/20';
      case 'analysis':
        return 'border-blue-500/30 bg-blue-950/20';
      case 'ai':
        return 'border-purple-500/30 bg-purple-950/20';
      case 'brain':
        return 'border-pink-500/30 bg-pink-950/20';
      case 'debug':
        return 'border-green-500/30 bg-green-950/20';
      case 'git':
        return 'border-orange-500/30 bg-orange-950/20';
      default:
        return 'border-gray-500/30 bg-gray-950/20';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {showTabs && (
        <div className="flex gap-1 p-2 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            All ({results.length})
          </button>
          <button
            onClick={() => setActiveTab('swarm')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1 ${
              activeTab === 'swarm'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            Swarm
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1 ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Activity className="w-3 h-3" />
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1 ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            AI
          </button>
          <button
            onClick={() => setActiveTab('brain')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1 ${
              activeTab === 'brain'
                ? 'bg-pink-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Brain className="w-3 h-3" />
            Brain
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-2" style={{ maxHeight }}>
        {filteredResults.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No results yet</p>
            <p className="text-sm mt-1">Run swarm, analysis, or AI operations</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.map(result => (
              <div
                key={result.id}
                onClick={() => onResultClick?.(result)}
                className={`p-3 rounded-lg border ${getTypeColor(result.type)} cursor-pointer hover:brightness-110 transition`}
              >
                <div className="flex items-start gap-2">
                  {getTypeIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{result.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                      {result.source && ` • ${result.source}`}
                    </div>
                    <div className="mt-2 text-xs text-gray-200 font-mono whitespace-pre-wrap line-clamp-3">
                      {result.content.substring(0, 200)}
                      {result.content.length > 200 && '...'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="p-2 border-t border-gray-700 bg-gray-800">
          <button
            onClick={() => setResults([])}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            Clear all results
          </button>
        </div>
      )}
    </div>
  );
}