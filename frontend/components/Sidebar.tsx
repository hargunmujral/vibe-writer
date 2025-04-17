"use client";

import { useState } from "react";
import { ProjectInfo } from "@/types/api";

interface SidebarProps {
  projects: ProjectInfo[];
  currentProject: string;
  onProjectChange: (projectName: string) => void;
}

const Sidebar = ({ 
  projects, 
  currentProject, 
  onProjectChange 
}: SidebarProps) => {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: newProjectName,
          description: newProjectDescription || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setNewProjectName("");
        setNewProjectDescription("");
        setIsCreatingProject(false);

        // Refresh projects (in a production app, you might want to add the new project to the existing list)
        window.location.reload();
      } else {
        setError(data.message || "Failed to create project");
      }
    } catch (err) {
      setError("Error connecting to the server");
      console.error(err);
    }
  };

  return (
    <aside className="w-64 bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Projects</h2>

      {/* Project list */}
      <ul className="space-y-2 mb-4">
        {projects.length === 0 ? (
          <li className="text-gray-400">No projects found</li>
        ) : (
          projects.map((project) => (
            <li key={project.project_name}>
              <button
                className={`w-full text-left px-3 py-2 rounded ${
                  project.project_name === currentProject
                    ? "bg-blue-700 text-white"
                    : "hover:bg-gray-700"
                }`}
                onClick={() => onProjectChange(project.project_name)}
              >
                {project.project_name}
                {project.description && (
                  <p className="text-xs text-gray-400 truncate">
                    {project.description}
                  </p>
                )}
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Create new project button/form */}
      {isCreatingProject ? (
        <div className="mt-4 p-3 bg-gray-700 rounded">
          <h3 className="text-sm font-semibold mb-2">Create New Project</h3>
          
          {error && (
            <div className="bg-red-500 text-white p-2 mb-2 rounded text-sm">
              {error}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Project Name"
            className="w-full p-2 mb-2 bg-gray-800 border border-gray-600 rounded"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          
          <textarea
            placeholder="Description (optional)"
            className="w-full p-2 mb-2 bg-gray-800 border border-gray-600 rounded"
            rows={2}
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          />
          
          <div className="flex justify-between">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              onClick={handleCreateProject}
            >
              Create
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                setIsCreatingProject(false);
                setNewProjectName("");
                setNewProjectDescription("");
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={() => setIsCreatingProject(true)}
        >
          New Project
        </button>
      )}

      {/* Settings section */}
      <div className="mt-8">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Settings</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700">
            Editor Preferences
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700">
            AI Configuration
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700">
            Theme
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 