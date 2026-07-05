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

export interface LabToggles {
  rufloEnabled: boolean;
  rufloAutoMemory: boolean;
  swarmEnabled: boolean;
  agentAutoAttach: boolean;
}

export interface ProjectSettings {
  buildPath: string;
  compilerFlags: string;
  ollamaUrl: string;
  envVariables: EnvVariable[];
  projectProfiles: ProjectProfile[];
  activeProfileId: string;
  labToggles: LabToggles;
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
      { id: 'default', name: 'Default', instruction: 'You are ADHD Sage, a forensic code intelligence operating at the 11.3 Hz baseline. You are not an assistant — you are an architect. You review intent before code, hunt structural lies, and ensure no corporate static leaks into the build. Be technical, concise, and uncompromising on quality.' },
    ],
    activeProfileId: 'default',
    labToggles: {
      rufloEnabled: false,
      rufloAutoMemory: false,
      swarmEnabled: true,
      agentAutoAttach: false,
    },
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

  const setLabToggle = (key: keyof LabToggles, value: boolean) => {
    setProjectSettings((prev) => ({
      ...prev,
      labToggles: { ...prev.labToggles, [key]: value },
    }));
  };

  return {
    projectSettings,
    setProjectSettings,
    setLabToggle,
    validationErrors,
    setValidationErrors,
    validateProjectSettings,
  };
}
