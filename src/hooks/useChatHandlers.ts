import React, { useState } from 'react';
import { Type } from '../services/googleGenAiStub';
import { makePrompt, markEphemeral } from '../utils/crimson-core';
import { AGENTS_MD_GUIDELINES } from '../data/reviewGuidelines';

export function useChatHandlers(
  editorContent: string,
  editorLanguage: string,
  chatMessages: any[],
  setChatMessages: any,
  editorAssistantInput: string,
  setEditorAssistantInput: any,
  editorAssistantMessages: any[],
  setEditorAssistantMessages: any,
  setIsEditorAssistantOpen: any,
  setIsAiProcessing: any,
  activePersonality: any,
  projectSettings: any,
  chatSummary: string,
  studioInput: string,
  setStudioInput: any,
  studioRefImage: any,
  projectFiles: any[],
  setProjectFiles: any,
  activeFileId: string,
  setActiveFileId: any,
  setEditorContent: any,
  setEditorLanguage: any,
  setEditorMode: any,
  markFileDirty: any,
  setEditorOutput: any,
  generateAIResponse: any,
  prepareContext: any,
) {
  const [lastEditorAssistantPrompt, setLastEditorAssistantPrompt] = useState('');

  const handleEditorAssistantSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const prompt = promptOverride || editorAssistantInput.trim();
    if (!prompt) return;

    if (!promptOverride) {
      setLastEditorAssistantPrompt(prompt);
      setEditorAssistantInput('');
    }

    const activeFileName = projectFiles.find((f: any) => f.id === activeFileId)?.name || 'unknown';
    const recentMessages = editorAssistantMessages
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');

    setEditorAssistantMessages((prev: any[]) => [...prev, { role: 'user', text: prompt }]);
    setIsAiProcessing(true);

    try {
      const response = await generateAIResponse(
        `[NEURAL_CONTEXT_INIT]
Active File: ${activeFileName}
Language: ${editorLanguage}

[HISTORY_STREAM]
${recentMessages || 'No previous history.'}

[CODE_BUFFER_START]
\`\`\`${editorLanguage}
${editorContent}
\`\`\`
[CODE_BUFFER_END]

[OPERATOR_DIRECTIVE]
${prompt}`,
        'You are the Crimson Neural Assistant, a world-class coding intelligence. Help the operator with their code. Be extremely technical, concise, and pro-active. Always wrap code snippets in triple backticks with the correct language. If you identify security flaws, performance bottlenecks, or logical errors, highlight them immediately using [ALERT] blocks.',
        { modelType: 'smart' },
      );

      const text = response || 'Neural synchronization complete. No response payload.';
      const codeMatch = text.match(/```[\s\S]*?```/);
      const extractedCode = codeMatch ? codeMatch[0].replace(/```[a-z]*\n|```/g, '') : null;

      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text,
          metadata: extractedCode ? { generatedCode: extractedCode } : undefined,
        },
      ]);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        { role: 'ai', text: `[CRITICAL_FAILURE] Neural link severed. Reason: ${errorMsg}` },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = studioInput.trim();
    if (!prompt && !studioRefImage) return;

    setChatMessages((prev: any[]) => [
      ...prev,
      {
        role: 'user',
        text: prompt || 'Frame-to-Image Generation Requested',
        timestamp: Date.now(),
      },
    ]);
    setStudioInput('');
    setIsAiProcessing(true);

    try {
      const brainContext = await prepareContext(prompt, activePersonality.id);
      const activeProfile =
        projectSettings.projectProfiles.find(
          (p: any) => p.id === projectSettings.activeProfileId,
        ) || projectSettings.projectProfiles[0];
      const kbDocs = (activePersonality.knowledgeBase ?? [])
        .map((e: any) => `[KB: ${e.name}]\n${e.content}`)
        .join('\n\n---\n\n');

      // Build conversation history from the last 6 messages (3 turns)
      const recentHistory = chatMessages
        .slice(-6)
        .map((m: any) => {
          const prefix = m.role === 'user' ? 'USER' : 'ASSISTANT';
          const text = m.text.length > 800 ? m.text.slice(0, 800) + '...[truncated]' : m.text;
          return `${prefix}: ${text}`;
        })
        .join('\n\n');

      // Build editor context if the user has a file open
      const activeFileName = projectFiles.find((f: any) => f.id === activeFileId)?.name || null;
      const editorCtx =
        activeFileName && editorContent
          ? `\n\nEDITOR_CONTEXT:\nActive File: ${activeFileName} (${editorLanguage})\n\`\`\`${editorLanguage}\n${editorContent.length > 4000 ? editorContent.slice(0, 4000) + '\n...[file truncated]' : editorContent}\n\`\`\``
          : '';

      const systemInstruction = `${activePersonality.instruction}${kbDocs ? `\n\nKNOWLEDGE BASE:\n${kbDocs}` : ''}\n\nPROJECT_PROFILE: ${activeProfile.instruction}${chatSummary ? `\n\nCONVERSATION_SUMMARY: ${chatSummary}` : ''}${recentHistory ? `\n\nCONVERSATION_HISTORY:\n${recentHistory}` : ''}${editorCtx}`;

      const fileCreationMatch = prompt.match(
        /(?:create|generate) a (?:new )?file named ([a-zA-Z0-9_\-\.]+)/i,
      );
      if (fileCreationMatch) {
        const fileName = fileCreationMatch[1];
        const ext = fileName.split('.').pop();
        const langMap: Record<string, string> = {
          py: 'python',
          js: 'javascript',
          ts: 'typescript',
          html: 'html',
          css: 'css',
          rs: 'rust',
          cpp: 'cpp',
          json: 'json',
        };
        const language = langMap[ext || ''] || 'text';

        setChatMessages((prev: any[]) => [
          ...prev,
          { role: 'ai', text: `Generating file ${fileName}...`, timestamp: Date.now() },
        ]);

        const response: string = await generateAIResponse(
          `Write the content for a file named ${fileName}. The file should contain ${prompt.replace(fileCreationMatch[0], '')}. Provide ONLY the raw code content.`,
          systemInstruction,
          { modelType: 'smart' },
        );

        const id = `file_${Date.now()}`;
        const newFile = {
          id,
          name: fileName,
          type: 'file' as const,
          parentId: 'root',
          language,
          content: response,
        };

        setProjectFiles((prev: any[]) => [...prev, newFile]);
        setActiveFileId(id);
        setEditorContent(response);
        setEditorLanguage(language);
        setEditorMode(language === 'html' ? 'preview' : 'code');
        markEphemeral([id]).catch(console.warn);

        setChatMessages((prev: any[]) => [
          ...prev,
          {
            role: 'ai',
            text: `Successfully generated and opened \`${fileName}\`.`,
            timestamp: Date.now(),
          },
        ]);
      } else {
        const response = await generateAIResponse(prompt, systemInstruction, {
          modelType: 'smart',
        });
        setChatMessages((prev: any[]) => [
          ...prev,
          { role: 'ai', text: response || 'No response.', timestamp: Date.now() },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev: any[]) => [
        ...prev,
        { role: 'ai', text: `[ERROR] ${err.message}`, timestamp: Date.now() },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleReviewCode = async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Review the following ${editorLanguage} code based on the provided guidelines:\n\n${AGENTS_MD_GUIDELINES}\n\nCode:\n${editorContent}`,
        'You are a senior software engineer and code reviewer. Provide a concise, actionable code review based on the provided guidelines. Structure your feedback by severity (CRITICAL, HIGH, MEDIUM, LOW) and provide specific examples of issues and fixes.',
        { modelType: 'smart' },
      );

      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text: `CODE_REVIEW:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text: '[ERROR] Code review failed.',
        },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCodeReview = async () => {
    setIsAiProcessing(true);
    setEditorAssistantMessages((prev: any[]) => [
      ...prev,
      { role: 'user', text: 'Perform a code review on the current file.' },
    ]);

    try {
      const response = await generateAIResponse(
        `Review the following code for security, performance, and maintainability best practices. Provide a structured review report.\n\nCode:\n${editorContent}`,
        'You are an expert code reviewer. Provide a structured review report covering security, performance, and maintainability. Use markdown for the report.',
        { modelType: 'smart' },
      );

      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        { role: 'ai', text: response || 'Code review complete.' },
      ]);
    } catch (err) {
      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        { role: 'ai', text: 'CRITICAL ERROR: Code review failed.' },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleExplainCode = async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        makePrompt({
          lang: editorLanguage,
          code: editorContent,
          instruction: 'Analyze and explain this code. Suggest optimizations where possible.',
        }),
        'You are a senior software engineer. Provide a deep technical analysis of the code. Be concise but thorough.',
        { modelType: 'smart' },
      );

      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text: `CODE_ANALYSIS:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Analysis node offline.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAnalyzeData = async () => {
    setIsAiProcessing(true);
    try {
      const dataAnalystInstruction =
        'You are the Data Analyst, a specialized intelligence focused on code analysis, performance profiling, and suggesting data visualization improvements. You provide actionable insights from complex datasets and code structures.';
      const response = await generateAIResponse(
        makePrompt({
          lang: editorLanguage,
          code: editorContent,
          instruction:
            'Analyze this code for performance bottlenecks and suggest data visualization improvements.',
        }),
        dataAnalystInstruction,
        { modelType: 'smart' },
      );

      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text: `DATA_ANALYSIS:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text: '[ERROR] Data analysis failed.',
        },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleGenerateDocs = async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        makePrompt({
          lang: editorLanguage,
          code: editorContent,
          instruction:
            'Generate comprehensive documentation (docstrings, JSDoc, or comments) for this code. Focus on explaining the logic, parameters, and return values.',
          extra: "Return a JSON object with 'documentedCode' and 'summary' fields.",
          json: true,
        }),
        `You are a world-class documentation expert. Generate clear, concise, and helpful documentation for the provided ${editorLanguage} code. Always return valid JSON.`,
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentedCode: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ['documentedCode', 'summary'],
          },
        },
      );

      const result = JSON.parse(response || '{}');

      setEditorAssistantMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          text: `DOCUMENTATION_GENERATED: Neural analysis complete. Comprehensive documentation has been synthesized for the entire file.\n\nSUMMARY:\n${result.summary}`,
          metadata: {
            documentedCode: result.documentedCode,
            isSelection: false,
            selection: null,
          },
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Documentation generation failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDocumentation = (
    documentedCode: string,
    isSelection: boolean,
    selection: any,
  ) => {
    setEditorContent(documentedCode);
    if (activeFileId) markFileDirty(activeFileId);
    setEditorOutput((prev: string) => prev + `[SYSTEM] Documentation applied successfully.\n`);
  };

  return {
    handleEditorAssistantSubmit,
    handleStudioSubmit,
    handleReviewCode,
    handleCodeReview,
    handleExplainCode,
    handleAnalyzeData,
    handleGenerateDocs,
    handleApplyDocumentation,
    lastEditorAssistantPrompt,
  };
}
