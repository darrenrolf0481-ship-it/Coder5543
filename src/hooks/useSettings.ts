import { useState, useCallback } from 'react';

export const useSettings = () => {
  const [projectSettings, setProjectSettings] = useState({
    buildPath: './dist',
    compilerFlags: '-O3 -march=native',
    ollamaUrl: 'http://127.0.0.1:11434',
    envVariables: [
      { key: 'NEURAL_MODE', value: 'production' },
      { key: 'BRAIN_CORE_COUNT', value: '128' }
    ]
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateProjectSettings = useCallback((settings: typeof projectSettings) => {
    const errors: Record<string, string> = {};

    if (!settings.buildPath.trim()) {
      errors.buildPath = 'Build path is required';
    } else if (!/^[\.\/a-zA-Z0-9_-]+$/.test(settings.buildPath)) {
      errors.buildPath = 'Invalid path format';
    }

    if (settings.ollamaUrl && !/^https?:\/\/.+/.test(settings.ollamaUrl)) {
      errors.ollamaUrl = 'Invalid URL format';
    }

    if (!settings.compilerFlags.trim()) {
      errors.compilerFlags = 'Compiler flags are required';
    }

    settings.envVariables.forEach((env, idx) => {
      if (!env.key.trim()) {
        errors[`env_key_${idx}`] = 'Key is required';
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env.key)) {
        errors[`env_key_${idx}`] = 'Invalid key format';
      }
      if (!env.value.trim()) {
        errors[`env_value_${idx}`] = 'Value is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const updateProjectSettings = useCallback((newSettings: Partial<typeof projectSettings>) => {
    setProjectSettings(prev => {
        const updated = { ...prev, ...newSettings };
        validateProjectSettings(updated);
        return updated;
    });
  }, [validateProjectSettings]);

  return {
    projectSettings,
    setProjectSettings,
    updateProjectSettings,
    validationErrors,
    validateProjectSettings
  };
};
