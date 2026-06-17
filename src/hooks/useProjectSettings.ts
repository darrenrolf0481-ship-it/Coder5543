import { useState } from 'react';

export interface ProjectProfile {
  id: string;
  name: string;
  instruction: string;
}

export interface EnvVariable {
  key: string;
  value: string;
}

export interface ProjectSettings {
  buildPath: string;
  compilerFlags: string;
  ollamaUrl: string;
  envVariables: EnvVariable[];
  projectProfiles: ProjectProfile[];
  activeProfileId: string;
}

export function useProjectSettings() {
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    buildPath: './dist',
    compilerFlags: '-O3 -march=native',
    ollamaUrl: 'http://127.0.0.1:11434',
    envVariables: [
      { key: 'NEURAL_MODE', value: 'production' },
      { key: 'BRAIN_CORE_COUNT', value: '128' },
    ],
    projectProfiles: [
      { id: 'default', name: 'Default', instruction: 'You are a helpful coding assistant.' },
    ],
    activeProfileId: 'default',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateProjectSettings = (settings: ProjectSettings) => {
    const errors: Record<string, string> = {};

    if (!settings.buildPath.trim()) {
      errors.buildPath = 'Build path is required';
    } else if (
      !/^[\.\/a-zA-Z0-9_-]+$/.test(settings.buildPath) ||
      settings.buildPath.split('/').some((seg) => seg === '..')
    ) {
      errors.buildPath =
        'Invalid path format (use alphanumeric, dots, slashes, underscores, hyphens; ".." not allowed)';
    }

    if (settings.ollamaUrl && !/^https?:\/\/.+/.test(settings.ollamaUrl)) {
      errors.ollamaUrl = 'Invalid URL format (must start with http:// or https://)';
    }

    if (!settings.compilerFlags.trim()) {
      errors.compilerFlags = 'Compiler flags are required';
    }

    settings.envVariables.forEach((env, idx) => {
      if (!env.key.trim()) {
        errors[`env_key_${idx}`] = 'Key is required';
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env.key)) {
        errors[`env_key_${idx}`] =
          'Invalid key format (must start with letter/underscore and contain only alphanumeric/underscore)';
      }

      if (!env.value.trim()) {
        errors[`env_value_${idx}`] = 'Value is required';
      }
    });

    settings.projectProfiles.forEach((profile, idx) => {
      if (!profile.name.trim()) {
        errors[`profile_name_${idx}`] = 'Profile name is required';
      }
    });

    const activeProfile = settings.projectProfiles.find((p) => p.id === settings.activeProfileId);
    if (!activeProfile) {
      errors.activeProfileId = 'Invalid active profile ID';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    projectSettings,
    setProjectSettings,
    validationErrors,
    setValidationErrors,
    validateProjectSettings,
  };
}
