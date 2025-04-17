"use client";

import { useState, useEffect } from "react";
import Editor from "@/components/Editor";
import Sidebar from "@/components/Sidebar";
import TabsContainer from "@/components/TabsContainer";
import { ProjectInfo } from "@/types/api";

export default function Home() {
  const [projectName, setProjectName] = useState<string>("default_project");
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available projects on mount
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:8000/projects");
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects);
          
          // If there are projects, set the first one as active
          if (data.projects.length > 0) {
            setProjectName(data.projects[0].project_name);
          }
        } else {
          setError("Failed to load projects");
        }
      } catch (err) {
        setError("Error connecting to the server");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handler for project change
  const handleProjectChange = (projectName: string) => {
    setProjectName(projectName);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vibe Writer</h1>
          <span className="text-gray-400">An AI-powered writing assistant for long-form storytelling</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          projects={projects}
          currentProject={projectName}
          onProjectChange={handleProjectChange}
        />

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500 text-white p-4 rounded">
              {error}
            </div>
          ) : (
            <TabsContainer projectName={projectName} />
          )}
        </div>
      </div>
    </main>
  );
} 