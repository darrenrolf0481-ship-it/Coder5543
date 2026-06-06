import { useState, useCallback } from 'react';
import { Type } from '../services/googleGenAiStub';

export function useEditorHandlers(
  editorLanguage: string,
  editorContent: string,
  generateAIResponse: any,
  setEditorContent: any,
  setEditorOutput: any,
  setIsAiProcessing: any,
  setEditorAssistantMessages: any,
  setIsEditorAssistantOpen: any,
  activeFileId: string,
  projectFiles: any[],
  setProjectFiles: any,
  markFileDirty: any
) {
  const handleFormatCode = useCallback(async (isMobile: boolean = false) => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `[Context: language=${editorLanguage}]\n\nFormat this code using standard conventions. ${isMobile ? 'Optimise for mobile: shorter line lengths and vertical layout.' : 'Ensure proper indentation, spacing, and line breaks.'}\n\n\`\`\`${editorLanguage}\n${editorContent}\n\`\`\``,
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
  }, [editorLanguage, editorContent, generateAIResponse, setEditorContent, setEditorOutput, setIsAiProcessing]);

  const handleRefactorCode = useCallback(async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `[Context: language=${editorLanguage}]\n\nRefactor this code for better performance, readability, and structural integrity.\n\n\`\`\`${editorLanguage}\n${editorContent}\n\`\`\``,
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

      const result = JSON.parse(response || '{}');

      setEditorAssistantMessages((prev: any) => [
        ...prev,
        {
          role: 'ai',
          text: `REFACTOR_COMPLETE:\n${result.explanation}\n\n${result.refactoredCode}`,
          metadata: {
            refactoredCode: result.refactoredCode,
            explanation: result.explanation,
          },
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Refactoring engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  }, [editorLanguage, editorContent, generateAIResponse, setEditorOutput, setIsAiProcessing, setEditorAssistantMessages, setIsEditorAssistantOpen]);

  const handleGenerateDocs = useCallback(async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `[Context: language=${editorLanguage}]\n\nGenerate comprehensive documentation (docstrings, JSDoc, or comments) for this code. Focus on explaining the logic, parameters, and return values.\n\n\`\`\`${editorLanguage}\n${editorContent}\n\`\`\``,
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
        }
      );

      const result = JSON.parse(response || '{}');

      setEditorAssistantMessages((prev: any) => [
        ...prev,
        {
          role: 'ai',
          text: `DOCUMENTATION_GENERATED: Neural analysis complete. Comprehensive documentation has been synthesized.\n\nSUMMARY:\n${result.summary}`,
          metadata: {
            documentedCode: result.documentedCode,
          },
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Documentation generation failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  }, [editorLanguage, editorContent, generateAIResponse, setEditorOutput, setIsAiProcessing, setEditorAssistantMessages, setIsEditorAssistantOpen]);

  return {
    handleFormatCode,
    handleRefactorCode,
    handleGenerateDocs,
  };
}
