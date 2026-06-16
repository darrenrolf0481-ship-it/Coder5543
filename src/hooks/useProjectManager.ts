import { useState, useEffect, useCallback } from 'react';
import { ProjectFile } from './editor/useEditorFileSystem';

export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: number;
  lastAccessed: number;
}

const STORAGE_KEY = 'crimson_active_project';
const PROJECTS_KEY = 'crimson_saved_projects';

export function useProjectManager() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);

  // Load saved projects on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) {
        const projects: Project[] = JSON.parse(saved);
        setSavedProjects(projects);
      }

      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        setCurrentProject(JSON.parse(current));
      }
    } catch (err) {
      console.error('[useProjectManager] Failed to load projects:', err);
    }
  }, []);

  // Save current project whenever it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProject));
    }
  }, [currentProject]);

  const createProject = useCallback((name: string, files: ProjectFile[] = []): Project => {
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      files,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    const newSavedProjects = [...savedProjects, project];
    setSavedProjects(newSavedProjects);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(newSavedProjects));
    setCurrentProject(project);

    return project;
  }, [savedProjects]);

  const switchProject = useCallback((projectId: string) => {
    const project = savedProjects.find(p => p.id === projectId);
    if (project) {
      project.lastAccessed = Date.now();
      setCurrentProject(project);

      // Update saved projects with new lastAccessed
      const updated = savedProjects.map(p =>
        p.id === projectId ? { ...p, lastAccessed: Date.now() } : p
      );
      setSavedProjects(updated);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
    }
  }, [savedProjects]);

  const deleteProject = useCallback((projectId: string) => {
    const updated = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updated);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));

    if (currentProject?.id === projectId) {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentProject(null);
    }
  }, [savedProjects, currentProject]);

  const renameProject = useCallback((projectId: string, newName: string) => {
    const updated = savedProjects.map(p =>
      p.id === projectId ? { ...p, name: newName } : p
    );
    setSavedProjects(updated);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));

    if (currentProject?.id === projectId) {
      setCurrentProject({ ...currentProject, name: newName });
    }
  }, [savedProjects, currentProject]);

  const updateProjectFiles = useCallback((files: ProjectFile[]) => {
    if (currentProject) {
      const updated: Project = {
        ...currentProject,
        files,
        lastAccessed: Date.now(),
      };
      setCurrentProject(updated);

      // Also update in saved projects
      const updatedSaved = savedProjects.map(p =>
        p.id === currentProject.id ? updated : p
      );
      setSavedProjects(updatedSaved);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedSaved));
    }
  }, [currentProject, savedProjects]);

  return {
    currentProject,
    savedProjects,
    createProject,
    switchProject,
    deleteProject,
    renameProject,
    updateProjectFiles,
  };
}