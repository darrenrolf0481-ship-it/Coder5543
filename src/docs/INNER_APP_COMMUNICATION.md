# Inner App Communication Integration Guide

## Overview

This guide shows how to integrate the unified event bus and consolidated analysis service into your existing panels and components.

## What This Solves

1. **No more bouncing between tabs** - Results from swarm/analysis automatically appear in unified results panel
2. **Consolidated functionality** - All analysis functions in one service
3. **Real-time updates** - All panels see results immediately via event bus
4. **Cross-panel awareness** - Panels can react to events from other panels

---

## Integration Steps

### 1. Add Event Bus to Existing Components

#### In `src/App.tsx`:

```typescript
import { eventBus } from './services/eventBus';

// Inside AppInner, after existing hooks:

// Emit editor file changes
useEffect(() => {
  if (fsState.activeFileId && fsState.editorContent) {
    eventBus.emit('editor:file_changed', {
      fileId: fsState.activeFileId,
      content: fsState.editorContent,
    }, 'App');
  }
}, [fsState.activeFileId, fsState.editorContent]);

// Emit swarm results
useEffect(() => {
  if (swarmState.lastReport) {
    eventBus.emit('swarm:completed', {
      mission: swarmState.missionInput,
      results: swarmState.lastReport,
      agents: swarmState.swarmAgents,
    }, 'App');
  }
}, [swarmState.lastReport]);
```

### 2. Wire Analysis Service

#### Replace individual analysis functions with unified service:

```typescript
import { analysisService } from './services/analysisService';
import { useEventEmitter } from './services/eventBus';

// In your component:
const emitter = useEventEmitter('AnalysisPanel');

const handleAnalyzeCode = async () => {
  try {
    const results = await analysisService.analyzeProject(
      fsState.projectFiles,
      { types: ['static', 'security'], deep: false }
    );
    
    // Results are automatically broadcast via event bus
    // No need to manually set debugAnalysis or switch tabs
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

### 3. Add Unified Results Panel

#### In your main layout:

```typescript
import { UnifiedResultsPanel } from './components/panels/UnifiedResultsPanel';

// In your render:
{activeTab === 'results' && (
  <UnifiedResultsPanel
    maxHeight="calc(100vh - 200px)"
    showTabs={true}
    onResultClick={(result) => {
      // Handle clicking on a result
      console.log('Result clicked:', result);
      // Could navigate to file, open in editor, etc.
    }}
  />
)}
```

### 4. Update Swarm to Emit Events

#### In `src/hooks/useSwarm.ts`:

```typescript
import { useEventEmitter } from '../services/eventBus';

// Inside useSwarm hook:
const emitter = useEventEmitter('useSwarm');

// Replace handleAgentComplete:
handleAgentComplete = useCallback((result: AgentRunResult) => {
  const agent = swarmAgents.find((a) => a.id === result.agentId);
  if (!agent) return;

  if (result.status === 'fulfilled' && result.response) {
    // Emit to event bus
    emitter.emit('swarm:agent_update', {
      agentId: result.agentId,
      agentName: agent.name,
      expertise: agent.expertise,
      confidence: result.confidence,
      keyClaims: result.keyClaims,
      output: result.response,
    });

    // Still call original callback
    onAgentChatUpdate?.(
      agent.name,
      `**${agent.name}** (${agent.expertise}) — Confidence: ${result.confidence !== undefined ? `${(result.confidence * 100).toFixed(0)}%` : 'unknown'}\n\nKey claims:\n- ${result.keyClaims?.length ? result.keyClaims.join('\n- ') : 'No key claims extracted.'}`,
      'claim',
    );
  } else if (result.status === 'rejected') {
    emitter.emit('swarm:error', {
      agentId: result.agentId,
      agentName: agent.name,
      error: result.error,
    });

    onAgentChatUpdate?.(agent.name, `**${agent.name}** failed: ${result.error}`, 'claim');
  }
}, [swarmAgents, onAgentChatUpdate, emitter]);
```

### 5. Add Quick Access Button

#### Create a floating button to show unified results:

```typescript
import { Activity } from 'lucide-react';

// In your main UI:
<button
  onClick={() => setActiveTab('results')}
  className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700"
  title="View Results"
>
  <Activity className="w-5 h-5 text-white" />
</button>
```

---

## Event Reference

### Swarm Events
- `swarm:started` - Swarm mission started
- `swarm:completed` - Swarm mission finished
- `swarm:agent_update` - Individual agent completed
- `swarm:error` - Swarm error
- `swarm:log` - Swarm log message

### Analysis Events
- `analysis:started` - Analysis started
- `analysis:completed` - Analysis finished
- `analysis:error` - Analysis error
- `analysis:result` - Individual analysis result

### Editor Events
- `editor:file_changed` - Active file changed
- `editor:file_saved` - File saved
- `editor:code_executed` - Code executed

### AI Events
- `ai:request_started` - AI request started
- `ai:request_completed` - AI request finished
- `ai:response` - AI response received

### Brain Events
- `brain:activated` - Brain activated
- `brain:memory_stored` - Memory stored
- `brain:insight` - Brain insight generated

### Git Events
- `git:committed` - Git commit made
- `git:pulled` - Git pull completed
- `git:pushed` - Git push completed

---

## Migration Path

### Phase 1: Add Event Bus (Non-Breaking)
1. Import eventBus to App.tsx
2. Emit events from existing code (no removal of old callbacks)
3. Both old and new systems work side-by-side

### Phase 2: Add Unified Results Panel
1. Create new "Results" tab
2. Show unified results there
3. Keep existing panels for now

### Phase 3: Consolidate Analysis
1. Replace individual analysis functions with analysisService
2. Remove duplicate code from individual panels
3. All analysis now goes through unified service

### Phase 4: Remove Old Systems
1. Remove manual result management from individual panels
2. Remove duplicate analysis code
3. Simplify component props (no need to pass callbacks everywhere)

---

## Benefits

✅ **No More Context Switching** - Results automatically appear in unified panel
✅ **Real-Time Updates** - All panels see results immediately
✅ **Consolidated Code** - One analysis service instead of duplicated functions
✅ **Event-Driven** - Loose coupling between components
✅ **Extensible** - Easy to add new event types and listeners
✅ **Debuggable** - Event history shows what happened when
✅ **Testable** - Components can be tested in isolation

---

## Example: Converting Analysis Panel

### Before:
```typescript
// In AnalysisPanel.tsx
const handleScanCode = async () => {
  const result = await runStaticAnalysis(editorContent);
  setDebugAnalysis(result);
  // User must manually switch to analysis tab
};
```

### After:
```typescript
// In any component
const handleAnalyze = async () => {
  await analysisService.analyzeProject(projectFiles, { deep: true });
  // Results automatically appear in unified panel
  // No need to set state or switch tabs
};
```

---

## Testing the Integration

```bash
# 1. Run a swarm mission
# Results should appear in unified results panel automatically

# 2. Run code analysis
# Results should appear without manual tab switching

# 3. Switch between tabs
# Results persist and are still visible when you return
```

---

## Next Steps

1. **Integrate into App.tsx** - Add event emissions for key actions
2. **Update panels** - Wire existing panels to use event bus
3. **Add unified results tab** - Create dedicated results view
4. **Remove duplicates** - Consolidate duplicate analysis functions
5. **Test thoroughly** - Ensure all events flow correctly

The result: A cohesive, communicating app where all components work together as a team! 🎉