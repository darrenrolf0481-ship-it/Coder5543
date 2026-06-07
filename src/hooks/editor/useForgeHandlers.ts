import { useState, useCallback } from 'react';
import { Type } from '../../services/googleGenAiStub';
import { makePrompt, markEphemeral } from '../../utils/crimson-core';
import { PROJECT_TEMPLATES } from '../../services/templates';
import { extractJson } from '../../utils/helpers';

export function useForgeHandlers(
  editorContent: string,
  setEditorContent: any,
  editorLanguage: string,
  setEditorLanguage: any,
  setEditorMode: any,
  setEditorOutput: any,
  setIsAiProcessing: any,
  activePersonality: any,
  prepareContext: any,
  setEditorAssistantMessages: any,
  setIsEditorAssistantOpen: any,
  projectFiles: any[],
  setProjectFiles: any,
  activeFileId: string,
  setActiveFileId: any,
  markFileDirty: any,
  monacoEditorRef: any,
  setGitRepo: any,
  setIsTemplateModalOpen: any,
  generateAIResponse: any
) {
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateMode, setGenerateMode] = useState<'snippet' | 'file'>('snippet');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [templateConfirmKey, setTemplateConfirmKey] = useState<keyof typeof PROJECT_TEMPLATES | null>(null);

  const handleFormatCode = async (isMobile: boolean = false) => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        makePrompt({
          lang: editorLanguage,
          code: editorContent,
          instruction: `Format this code using standard conventions. ${isMobile ? 'Optimise for mobile: shorter line lengths and vertical layout.' : 'Ensure proper indentation, spacing, and line breaks.'}`,
          extra: 'Return ONLY the formatted code, without any markdown fences or explanations.',
        }),
        'You are an expert code formatter. Return ONLY the formatted code. Do not wrap in markdown blocks.',
        { modelType: 'fast' }
      );

      if (response) {
        setEditorContent(response);
        setEditorOutput(
          (prev: string) => prev + `[SYSTEM] Code formatted successfully${isMobile ? ' (mobile)' : ''}.\n`
        );
      }
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Formatting engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRefactorCode = async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        makePrompt({
          lang: editorLanguage,
          code: editorContent,
          instruction: 'Refactor this code for better performance, readability, and structural integrity.',
          extra: "Return a JSON object with 'refactoredCode' and 'explanation' fields.",
          json: true,
        }),
        'You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.',
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['refactoredCode', 'explanation'],
          },
        }
      );

      const result = extractJson(response, {});

      setEditorAssistantMessages((prev: any) => [
        ...prev,
        {
          role: 'ai',
          text: `REFACTOR_COMPLETE:\n${result.explanation}\n\n${result.refactoredCode}`,
          metadata: {
            refactoredCode: result.refactoredCode,
            explanation: result.explanation,
            isSelection: false,
            selection: null,
          },
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Refactoring engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRefactorAllFiles = async () => {
    setIsAiProcessing(true);
    setEditorOutput((prev: string) => prev + '[SYSTEM] Initiating global project refactor...\n');

    try {
      const filesToRefactor = projectFiles.filter((f) => f.type === 'file');
      let updatedFiles = [...projectFiles];

      for (const file of filesToRefactor) {
        setEditorOutput((prev: string) => prev + `[INFO] Refactoring ${file.name}...\n`);
        try {
          const response = await generateAIResponse(
            makePrompt({
              lang: file.language || 'code',
              code: file.content,
              instruction: 'Refactor this code for better performance, readability, and structural integrity.',
              extra: "Return a JSON object with 'refactoredCode' and 'explanation' fields.",
              json: true,
            }),
            'You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.',
            {
              modelType: 'smart',
              json: true,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  refactoredCode: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['refactoredCode', 'explanation'],
              },
            }
          );

          const result = extractJson(response, {});
          if (result.refactoredCode) {
            updatedFiles = updatedFiles.map((f) =>
              f.id === file.id ? { ...f, content: result.refactoredCode } : f
            );
            setEditorOutput((prev: string) => prev + `[SUCCESS] ${file.name} refactored successfully.\n`);

            if (activeFileId === file.id) {
              setEditorContent(result.refactoredCode);
            }
          }
        } catch (err) {
          setEditorOutput((prev: string) => prev + `[ERROR] Failed to refactor ${file.name}.\n`);
        }
      }

      setProjectFiles(updatedFiles);
      setEditorOutput((prev: string) => prev + '[SYSTEM] Global project refactor complete.\n');
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Global refactoring engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const executeGenerateCode = async () => {
    if (!generatePrompt.trim()) return;

    setIsAiProcessing(true);
    setIsGenerateModalOpen(false);

    if (generateMode === 'snippet') {
      setEditorAssistantMessages((prev: any) => [
        ...prev,
        { role: 'user', text: `Forge request: ${generatePrompt}` },
      ]);
      setIsEditorAssistantOpen(true);

      try {
        const response = await generateAIResponse(
          `Language: ${editorLanguage}\nContext:\n${editorContent}\n\nGenerate code for: ${generatePrompt}`,
          "You are a master software engineer. Generate high-quality, efficient code based on the user's prompt. Provide ONLY the code snippet without markdown blocks if possible, or wrap it in a clear CODE_FORGE block. Include a brief explanation of how to use it.",
          { modelType: 'smart' }
        );

        const generatedText = response || 'Forge failed to materialize code.';
        const codeMatch = generatedText.match(/```[\s\S]*?```/);
        const extractedCode = codeMatch
          ? codeMatch[0].replace(/```[a-z]*\n|```/g, '')
          : generatedText;

        setEditorAssistantMessages((prev: any) => [
          ...prev,
          {
            role: 'ai',
            text: generatedText,
            metadata: { generatedCode: extractedCode, isSnippet: true },
          },
        ]);
      } catch (err) {
        setEditorAssistantMessages((prev: any) => [
          ...prev,
          { role: 'ai', text: 'FORGE_ERROR: Neural materialization failed.' },
        ]);
      } finally {
        setIsAiProcessing(false);
        setGeneratePrompt('');
      }
    } else {
      setEditorAssistantMessages((prev: any) => [
        ...prev,
        { role: 'user', text: `Forge request (New File): ${generatePrompt}` },
      ]);
      setIsEditorAssistantOpen(true);

      try {
        const response = await generateAIResponse(
          `Generate a complete, functional file for: ${generatePrompt}. Determine the best language and filename.`,
          "You are an expert developer. Output ONLY a JSON object with 'filename', 'language' (e.g., 'python', 'javascript', 'typescript', 'html', 'css'), and 'content' (the complete code). Do not include any markdown formatting or explanations outside the JSON.",
          { modelType: 'smart' }
        );

        if (response) {
          const fileData = extractJson(response, null);
          if (fileData && fileData.filename && fileData.content) {
            const newFileId = `gen_${Date.now()}`;
            const newFile = {
              id: newFileId,
              name: fileData.filename,
              type: 'file' as const,
              parentId: 'root',
              language: fileData.language || 'text',
              content: fileData.content,
            };

            setProjectFiles((prev: any[]) => {
              const updatedPrev = prev.map((f) =>
                f.id === activeFileId ? { ...f, content: editorContent } : f
              );
              return [...updatedPrev, newFile];
            });

            setActiveFileId(newFileId);
            setEditorContent(newFile.content);
            setEditorLanguage(newFile.language);
            setEditorMode(newFile.language === 'html' ? 'preview' : 'code');

            markEphemeral([newFileId]).catch(console.warn);

            setEditorAssistantMessages((prev: any) => [
              ...prev,
              {
                role: 'ai',
                text: `[FORGE] Successfully synthesized new file: ${fileData.filename}`,
              },
            ]);
          } else {
            setEditorAssistantMessages((prev: any) => [
              ...prev,
              { role: 'ai', text: `[FORGE_ERROR] Failed to parse generated file structure.` },
            ]);
          }
        }
      } catch (err) {
        setEditorAssistantMessages((prev: any) => [
          ...prev,
          { role: 'ai', text: `[FORGE_ERROR] Neural materialization failed.` },
        ]);
      } finally {
        setIsAiProcessing(false);
        setGeneratePrompt('');
      }
    }
  };

  const handleApplyForge = (code: string, isSnippet: boolean = false) => {
    if (isSnippet && monacoEditorRef.current) {
      const editor = monacoEditorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits('source', [{ range: selection, text: code }]);
      editor.focus();
      setEditorOutput((prev: string) => prev + '[SYSTEM] Neural Forge snippet integrated at cursor.\n');
    } else {
      setEditorContent(code);
      setEditorOutput((prev: string) => prev + '[SYSTEM] Neural Forge code replaced file content.\n');
    }
  };

  const handleApplyRefactor = (refactoredCode: string, isSelection: boolean, selection: any) => {
    setEditorContent(refactoredCode);
    if (activeFileId) markFileDirty(activeFileId);
    setEditorOutput((prev: string) => prev + `[SYSTEM] Refactoring applied successfully.\n`);
  };

  const handleGenerateCode = () => {
    setGeneratePrompt('');
    setIsGenerateModalOpen(true);
  };

  const handleLoadTemplate = (templateKey: keyof typeof PROJECT_TEMPLATES) => {
    setTemplateConfirmKey(templateKey);
  };

  const confirmLoadTemplate = () => {
    if (!templateConfirmKey) return;
    const template = PROJECT_TEMPLATES[templateConfirmKey];
    if (!template) return;

    setProjectFiles(template.files);

    const firstFile = template.files.find((f) => f.type === 'file');
    if (firstFile) {
      setActiveFileId(firstFile.id);
      setEditorContent(firstFile.content || '');
      setEditorLanguage(firstFile.language || 'text');
      setEditorMode(firstFile.language === 'html' ? 'preview' : 'code');
    }

    setGitRepo({
      initialized: false,
      branch: 'main',
      commits: [],
      staged: [],
      modified: [],
      stash: [],
    });

    setIsTemplateModalOpen(false);
    setTemplateConfirmKey(null);
  };

  const handleSaveAnalysis = (analysisText: string) => {
    const isAudit = analysisText.includes('DEEP_PROJECT_AUDIT');
    const defaultName = `${isAudit ? 'audit' : 'analysis'}_${new Date().getTime()}.md`;
    const chosenName = window.prompt('Enter filename to save analysis:', defaultName);

    if (chosenName === null) return;

    let fileName = chosenName.trim() || defaultName;
    if (!fileName.includes('.')) fileName += '.md';

    const newFile = {
      id: `analysis_${Date.now()}`,
      name: fileName,
      type: 'file' as const,
      parentId: 'root',
      language: 'markdown',
      content: analysisText,
    };

    setProjectFiles((prev: any[]) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setEditorContent(analysisText);
    setEditorLanguage('markdown');
    setEditorOutput(
      (prev: string) => prev + `[SYSTEM] Analysis saved as "${fileName}".\n`
    );
  };

  return {
    generatePrompt, setGeneratePrompt,
    generateMode, setGenerateMode,
    isGenerateModalOpen, setIsGenerateModalOpen,
    templateConfirmKey, setTemplateConfirmKey,
    handleFormatCode,
    handleRefactorCode,
    handleRefactorAllFiles,
    executeGenerateCode,
    handleApplyForge,
    handleApplyRefactor,
    handleGenerateCode,
    handleLoadTemplate,
    confirmLoadTemplate,
    handleSaveAnalysis
  };
}
