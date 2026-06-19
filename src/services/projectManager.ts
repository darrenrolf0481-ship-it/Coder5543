/**
 * Project Manager - Persistent project management system
 *
 * Manages project lifecycle:
 * - Create new projects
 * - List available projects
 * - Switch between projects
 * - Persist current project across sessions
 * - Load projects from disk (server-side projects/)
 */

import { resolveApiUrl } from '../utils/apiUrl';

export interface Project {
  id: string;
  name: string;
  path?: string; // Server-side path (for cloned repos)
  createdAt: number;
  lastAccessed: number;
  isDefault?: boolean;
}

const STORAGE_KEY = 'crimson_projects';
const CURRENT_PROJECT_KEY = 'crimson_current_project';

/**
 * Get all saved projects from localStorage
 */
export function listProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[ProjectManager] Failed to list projects:', err);
    return [];
  }
}

/**
 * Get the currently active project (persisted across sessions)
 */
export function getCurrentProject(): Project | null {
  try {
    const stored = localStorage.getItem(CURRENT_PROJECT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('[ProjectManager] Failed to get current project:', err);
    return null;
  }
}

/**
 * Save current project selection
 */
export function setCurrentProject(project: Project): void {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));

    // Update lastAccessed timestamp in project list
    const projects = listProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx].lastAccessed = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  } catch (err) {
    console.error('[ProjectManager] Failed to set current project:', err);
  }
}

/**
 * Create a new project
 */
export function createProject(name: string, path?: string): Project {
  const project: Project = {
    id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    path,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    isDefault: false,
  };

  const projects = listProjects();
  projects.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

  return project;
}

/**
 * Delete a project from the list (doesn't delete files)
 */
export function deleteProject(projectId: string): void {
  const projects = listProjects();
  const filtered = projects.filter(p => p.id !== projectId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // If this was the current project, clear it
  const current = getCurrentProject();
  if (current?.id === projectId) {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
}

/**
 * Rename a project
 */
export function renameProject(projectId: string, newName: string): void {
  const projects = listProjects();
  const project = projects.find(p => p.id === projectId);
  if (project) {
    project.name = newName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    // Update current project if needed
    const current = getCurrentProject();
    if (current?.id === projectId) {
      setCurrentProject(project);
    }
  }
}

/**
 * Initialize default project if no projects exist
 */
export function initializeDefaultProject(): Project {
  const projects = listProjects();
  if (projects.length === 0) {
    const defaultProject = createProject('Default Project');
    defaultProject.isDefault = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultProject]));
    return defaultProject;
  }
  return projects[0];
}

/**
 * Fetch list of server-side projects (from projects/ directory)
 */
export async function fetchServerProjects(): Promise<Project[]> {
  try {
    const res = await fetch(resolveApiUrl('github/projects'));
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return data.projects || [];
  } catch (err) {
    console.error('[ProjectManager] Failed to fetch server projects:', err);
    return [];
  }
}

/**
 * Load project files from server
 */
export async function loadProjectFiles(projectName: string): Promise<any[]> {
  try {
    const res = await fetch(resolveApiUrl(`github/load?project=${encodeURIComponent(projectName)}`));
    if (!res.ok) throw new Error('Failed to load project');
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('[ProjectManager] Failed to load project files:', err);
    return [];
  }
}