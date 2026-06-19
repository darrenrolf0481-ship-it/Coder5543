import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, RefreshCw, Trash2, Check } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  path?: string;
  createdAt: number;
  lastAccessed: number;
  isDefault?: boolean;
  isServerProject?: boolean;
}

interface ProjectPanelProps {
  currentProject: Project | null;
  savedProjects: Project[];
  onProjectSwitch: (project: Project) => void;
  onProjectCreate: (name: string) => void;
  onProjectDelete: (projectId: string) => void;
  onLoadServerProject: (projectName: string) => void;
}

export function ProjectPanel({
  currentProject,
  savedProjects,
  onProjectSwitch,
  onProjectCreate,
  onProjectDelete,
  onLoadServerProject,
}: ProjectPanelProps) {
  const [serverProjects, setServerProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'server'>('saved');

  // Load saved projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('./api/github/projects');
        if (res.ok) {
          const data = await res.json();
          setServerProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to fetch server projects:', err);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    onProjectCreate(newProjectName.trim());
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleLoadServerProject = async (projectName: string) => {
    onLoadServerProject(projectName);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="p-4 h-full flex flex-col bg-gray-900 text-gray-100">
      <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
        <FolderOpen className="w-5 h-5" />
        Projects
      </h2>

      {/* Current Project */}
      {currentProject && (
        <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
          <div className="text-xs text-blue-300 mb-1">CURRENT PROJECT</div>
          <div className="font-bold text-white">{currentProject.name}</div>
          {currentProject.path && (
            <div className="text-xs text-gray-400 mt-1">{currentProject.path}</div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-3 py-1 rounded ${
            activeTab === 'saved'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Saved Projects
        </button>
        <button
          onClick={() => setActiveTab('server')}
          className={`px-3 py-1 rounded ${
            activeTab === 'server'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Server Projects
        </button>
      </div>

      {/* Saved Projects Tab */}
      {activeTab === 'saved' && (
        <div className="flex-1 overflow-auto">
          <div className="space-y-2 mb-4">
            {savedProjects.map((project) => (
              <div
                key={project.id}
                className={`p-3 rounded-lg border ${
                  currentProject?.id === project.id
                    ? 'bg-blue-900/40 border-blue-500/50'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    {project.isDefault && (
                      <div className="text-xs text-gray-400">(Default)</div>
                    )}
                    <div className="text-xs text-gray-400">
                      Last accessed: {formatDate(project.lastAccessed)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {currentProject?.id !== project.id && (
                      <button
                        onClick={() => onProjectSwitch(project)}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-300"
                        title="Switch to this project"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {!project.isDefault && (
                      <button
                        onClick={() => onProjectDelete(project.id)}
                        className="p-1.5 rounded hover:bg-red-900/50 text-red-400"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isCreating ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewProjectName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName('');
                  }}
                  className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      )}

      {/* Server Projects Tab */}
      {activeTab === 'server' && (
        <div className="flex-1 overflow-auto">
          <div className="mb-3 flex justify-end">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('./api/github/projects');
                  if (res.ok) {
                    const data = await res.json();
                    setServerProjects(data.projects || []);
                  }
                } catch (err) {
                  console.error('Failed to refresh:', err);
                }
              }}
              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {serverProjects.map((project) => (
              <div
                key={project.id}
                className="p-3 rounded-lg border bg-gray-800 border-gray-700 hover:bg-gray-750"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-gray-400">
                      Cloned from GitHub
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadServerProject(project.name)}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}

            {serverProjects.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>No server projects found</p>
                <p className="text-sm mt-2">Clone a repository to create one</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}