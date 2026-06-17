import { useState, useCallback } from 'react';
import { makePrompt } from '../../utils/crimson-core';
import { extractJson } from '../../utils/helpers';

export function useAnalysisHandlers(
  editorContent: string,
  editorLanguage: string,
  editorAssistantInput: string,
  setEditorOutput: any,
  setEditorAssistantMessages: any,
  setIsEditorAssistantOpen: any,
  setIsAiProcessing: any,
  recordInteraction: any,
  projectFiles: any[],
  pipeline: any,
  isScanningCode: boolean,
  setIsScanningCode: any,
  setScanResults: any,
  activePersonality: any,
  generateAIResponse: any,
  prepareContext: any,
  setIsRunningCode: any,
  setEditorMode: any,
) {
  const [debugAnalysis, setDebugAnalysis] = useState<{
    static: {
      status: 'idle' | 'running' | 'done';
      issues: { type: 'error' | 'warning' | 'info'; message: string; line?: number }[];
    };
    tracing: { status: 'idle' | 'running' | 'done'; logs: string[] };
    refactoring: { status: 'idle' | 'running' | 'done'; suggestions: string[] };
  }>({
    static: { status: 'idle', issues: [] },
    tracing: { status: 'idle', logs: [] },
    refactoring: { status: 'idle', suggestions: [] },
  });

  const buildProjectContext = useCallback(() => {
    const chunks = projectFiles
      .filter((f) => f.type === 'file')
      .map((f) => `[File: ${f.name}]\n${f.content || ''}`);
    return chunks.join('\n\n---\n\n');
  }, [projectFiles]);

  const runStaticAnalysis = async () => {
    setDebugAnalysis((prev) => ({ ...prev, static: { status: 'running', issues: [] } }));
    try {
      const response = await generateAIResponse(
        `Perform a static analysis of the following ${editorLanguage} code. Identify errors, warnings, and info-level issues. Return a JSON array of objects with fields: type ("error"|"warning"|"info"), message (string), line (number|null).\n\nCode:\n${editorContent}`,
        'You are an expert static analysis engine. Return ONLY a valid JSON array, no markdown. Each item: { "type": "error"|"warning"|"info", "message": "...", "line": number|null }',
        { modelType: 'fast', json: true },
      );
      const issues = extractJson(response, [
        { type: 'info', message: 'Could not parse analysis results.', line: undefined },
      ]);
      setDebugAnalysis((prev) => ({ ...prev, static: { status: 'done', issues } }));
    } catch {
      setDebugAnalysis((prev) => ({
        ...prev,
        static: {
          status: 'done',
          issues: [{ type: 'error', message: 'Static analysis engine offline.', line: undefined }],
        },
      }));
    }
  };

  const runDynamicTracing = async () => {
    setDebugAnalysis((prev) => ({ ...prev, tracing: { status: 'running', logs: [] } }));
    try {
      const response = await generateAIResponse(
        `Simulate a dynamic trace of the following ${editorLanguage} code. Return a JSON array of trace log strings, simulating execution flow, variable mutations, and any exceptions.\n\nCode:\n${editorContent}`,
        'You are a dynamic execution tracer. Return ONLY a JSON array of strings — each string is a trace log line prefixed with [TRACE], [WARN], [EXEC], or [ERROR]. No markdown.',
        { modelType: 'fast', json: true },
      );
      const logs = extractJson(response, ['[TRACE] Unable to parse trace output.']);
      let i = 0;
      const interval = setInterval(() => {
        if (i < logs.length) {
          setDebugAnalysis((prev) => ({
            ...prev,
            tracing: { ...prev.tracing, logs: [...prev.tracing.logs, logs[i]] },
          }));
          i++;
        } else {
          clearInterval(interval);
          setDebugAnalysis((prev) => ({ ...prev, tracing: { ...prev.tracing, status: 'done' } }));
        }
      }, 400);
    } catch {
      setDebugAnalysis((prev) => ({
        ...prev,
        tracing: { status: 'done', logs: ['[ERROR] Trace engine offline.'] },
      }));
    }
  };

  const handleScanCode = async () => {
    if (isScanningCode) {
      setIsScanningCode(false);
      setScanResults([]);
      return;
    }
    setIsScanningCode(true);
    setScanResults([]);
    const safety = setTimeout(() => setIsScanningCode(false), 30_000);
    try {
      await pipeline.dispatch('CODE_SCAN_REQUESTED', 'scanner', {
        language: editorLanguage,
        code: editorContent,
      });
    } catch {
      setIsScanningCode(false);
    } finally {
      clearTimeout(safety);
    }
  };

  const handleAnalyzeCode = async () => {
    if (!editorAssistantInput.trim()) return;
    setIsAiProcessing(true);
    setEditorOutput('Analyzing code structure...\n');
    const prompt = makePrompt({
      lang: editorLanguage,
      code: editorContent,
      instruction: `Analyze this code based on this request: "${editorAssistantInput}"`,
      extra:
        'Provide a detailed, structured analysis pointing out vulnerabilities, performance issues, or architectural improvements.',
    });
    try {
      const response = await generateAIResponse(
        prompt,
        'You are an elite code analyst. Provide a detailed, side-by-side style analysis. Format your response clearly.',
      );
      if (response) {
        setEditorOutput(response);
        await recordInteraction(prompt, response, 'success');
      } else {
        setEditorOutput('[ERROR] Analysis engine failed.\n');
        await recordInteraction(prompt, '', 'failure');
      }
    } catch {
      setEditorOutput('[ERROR] Analysis engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleFullProjectAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = buildProjectContext();
      const response = await generateAIResponse(
        `Analyze this entire project. Provide a comprehensive overview of the architecture, potential bugs, and optimization strategies.\n\nProject Context:\n${projectContext}`,
        'You are a world-class software architect. Provide a deep, holistic analysis of the entire project. Focus on inter-file dependencies and overall design patterns.',
        { modelType: 'smart' },
      );
      setEditorAssistantMessages((prev: any) => [
        ...prev,
        { role: 'ai', text: `FULL_PROJECT_ANALYSIS:\n${response}` },
      ]);
      setIsEditorAssistantOpen(true);
    } catch {
      setEditorOutput((prev: string) => prev + '[ERROR] Neural project analysis failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDeepProjectAudit = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = buildProjectContext();
      const response = await generateAIResponse(
        `Perform a deep audit of this project. 
        Specifically identify:
        1. Code Redundancies
        2. Security Vulnerabilities
        3. Refactoring Opportunities
        Project Context:\n${projectContext}`,
        'You are a senior security researcher and lead software engineer. Your goal is to find flaws, inefficiencies, and risks in the codebase. Be thorough and critical.',
        { modelType: 'smart' },
      );
      setEditorAssistantMessages((prev: any) => [
        ...prev,
        { role: 'ai', text: `DEEP_PROJECT_AUDIT:\n${response}` },
      ]);
      setIsEditorAssistantOpen(true);
      setEditorOutput(
        (prev: string) =>
          prev + '[SYSTEM] Deep project audit complete. Check Neural Assistant for details.\n',
      );
    } catch {
      setEditorOutput((prev: string) => prev + '[ERROR] Deep project audit failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setEditorOutput('');
    setEditorMode('code');
    const safety = setTimeout(() => setIsRunningCode(false), 30_000);
    try {
      await pipeline.dispatch(
        'CODE_RUN_REQUESTED',
        'editor',
        { language: editorLanguage, code: editorContent },
        { meta: { subtype: 'run' } },
      );
    } catch {
      setIsRunningCode(false);
    } finally {
      clearTimeout(safety);
    }
  };

  const getRefactoringSuggestions = async () => {
    setDebugAnalysis((prev) => ({
      ...prev,
      refactoring: { ...prev.refactoring, status: 'running' },
    }));
    let outcome: 'success' | 'failure' | 'neutral' = 'neutral';
    const prompt = `As the ${activePersonality.name} personality, provide 3 short, high-impact code refactoring suggestions for a futuristic neural-linked application. Format as a simple list.`;
    let resultText = '';
    try {
      const brainContext = await prepareContext(prompt);
      const response = await generateAIResponse(
        prompt,
        activePersonality.instruction,
        { modelType: 'fast' },
        { brainContext },
      );
      const suggestions = (response?.split('\n') || [])
        .map((s) =>
          s
            .replace(/^[\s\d\.\-\*\)"]+/, '')
            .replace(/^["]+/, '')
            .replace(/["]+$/, '')
            .trim(),
        )
        .filter((s) => s.length > 10)
        .slice(0, 3);
      resultText = suggestions.join('\n');
      setDebugAnalysis((prev) => ({ ...prev, refactoring: { status: 'done', suggestions } }));
      outcome = 'success';
    } catch (error) {
      console.warn(error);
      resultText = 'Error retrieving suggestions.';
      setDebugAnalysis((prev) => ({
        ...prev,
        refactoring: {
          status: 'done',
          suggestions: ['Error retrieving suggestions. Neural link unstable.'],
        },
      }));
      outcome = 'failure';
    } finally {
      await recordInteraction(prompt, resultText, outcome);
    }
  };

  return {
    debugAnalysis,
    setDebugAnalysis,
    runStaticAnalysis,
    runDynamicTracing,
    handleScanCode,
    handleAnalyzeCode,
    handleFullProjectAnalysis,
    handleDeepProjectAudit,
    buildProjectContext,
    handleRunCode,
    getRefactoringSuggestions,
  };
}
